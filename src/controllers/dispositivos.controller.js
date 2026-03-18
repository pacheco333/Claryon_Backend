import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

/**
 * Obtener todos los dispositivos (no eliminados)
 * GET /api/dispositivos
 */
export const getDispositivos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT d.*, 
                    u.nombres as responsable_nombres, u.apellidos as responsable_apellidos,
                    ps.id_empleado, ps.estado as paz_salvo_estado
             FROM Dispositivos d
             LEFT JOIN Usuarios u ON d.id_responsable = u.id
             LEFT JOIN PazSalvos ps ON d.id_paz_salvo = ps.id
             WHERE d.eliminado = FALSE
             ORDER BY d.fecha_creacion DESC`
        );
        return res.json(rows);
    } catch (error) {
        console.error("getDispositivos:", error);
        return res.status(500).json({ message: "Error al obtener dispositivos", error: error.message });
    }
};

/**
 * Obtener un dispositivo por ID
 * GET /api/dispositivos/:id
 */
export const getDispositivoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT d.*,
                    u.nombres as responsable_nombres, u.apellidos as responsable_apellidos, u.correo as responsable_correo,
                    ps.id_empleado, ps.estado as paz_salvo_estado
             FROM Dispositivos d
             LEFT JOIN Usuarios u ON d.id_responsable = u.id
             LEFT JOIN PazSalvos ps ON d.id_paz_salvo = ps.id
             WHERE d.id = ? AND d.eliminado = FALSE`,
            [id]
        );
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Dispositivo no encontrado" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getDispositivoById:", error);
        return res.status(500).json({ message: "Error al obtener dispositivo", error: error.message });
    }
};


/**
 * Actualizar dispositivo (sin imágenes)
 * PUT /api/dispositivos/:id
 */
export const updateDispositivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_responsable, id_paz_salvo, observaciones } = req.body;

        // Verificar que el dispositivo existe
        const [dispositivo] = await pool.query(
            "SELECT id FROM Dispositivos WHERE id = ? AND eliminado = FALSE",
            [id]
        );
        if (!dispositivo || dispositivo.length === 0) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        // Validar responsable si se proporciona
        if (id_responsable) {
            const [usuario] = await pool.query(
                "SELECT id FROM Usuarios WHERE id = ? AND eliminado = FALSE",
                [id_responsable]
            );
            if (!usuario || usuario.length === 0) {
                return res.status(400).json({ message: "Usuario responsable no encontrado" });
            }
        }

        // Validar paz y salvo si se proporciona
        if (id_paz_salvo) {
            const [pazSalvo] = await pool.query(
                "SELECT id FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
                [id_paz_salvo]
            );
            if (!pazSalvo || pazSalvo.length === 0) {
                return res.status(400).json({ message: "Paz y salvo no encontrado" });
            }
        }

        const [result] = await pool.query(
            "UPDATE Dispositivos SET id_responsable = COALESCE(?, id_responsable), id_paz_salvo = COALESCE(?, id_paz_salvo), observaciones = COALESCE(?, observaciones) WHERE id = ?",
            [id_responsable || null, id_paz_salvo || null, observaciones || null, id]
        );

        return res.json({ message: "Dispositivo actualizado", id });
    } catch (error) {
        console.error("updateDispositivo:", error);
        return res.status(500).json({ message: "Error al actualizar dispositivo", error: error.message });
    }
};

/**
 * Crear dispositivo con fotografías opcionales
 * POST /api/dispositivos
 * Body (multipart/form-data):
 *   - id_responsable: number (requerido)
 *   - id_paz_salvo: number (requerido)
 *   - fotografia_1: File (opcional)
 *   - fotografia_2: File (opcional)
 *   - observaciones: string (opcional)
 * 
 * NOTA: La validación de usuario y paz_salvo se hace en el middleware ANTES de guardar imágenes
 */
export const createDispositivo = async (req, res) => {
    try {
        const { id_responsable, id_paz_salvo, observaciones } = req.body;
        const files = req.files || {};

        // Obtener el id_empleado asociado al paz y salvo
        const [pazSalvo] = await pool.query(
            "SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
            [id_paz_salvo]
        );
        
        if (!pazSalvo || pazSalvo.length === 0) {
            return res.status(400).json({ message: "Paz y salvo no encontrado" });
        }

        const empleadoId = pazSalvo[0].id_empleado;

        // Crear el dispositivo (las validaciones ya se hicieron en el middleware)
        const [result] = await pool.query(
            "INSERT INTO Dispositivos (id_responsable, id_paz_salvo, observaciones) VALUES (?, ?, ?)",
            [id_responsable, id_paz_salvo, observaciones || null]
        );

        const dispositivoId = result.insertId;
        let fotografia_1 = null;
        let fotografia_2 = null;

        // Procesar fotografía 1 si existe
        if (files.fotografia_1 && files.fotografia_1.length > 0) {
            fotografia_1 = `uploads/empleados/${empleadoId}/dispositivos/${files.fotografia_1[0].filename}`;
        }

        // Procesar fotografía 2 si existe
        if (files.fotografia_2 && files.fotografia_2.length > 0) {
            fotografia_2 = `uploads/empleados/${empleadoId}/dispositivos/${files.fotografia_2[0].filename}`;
        }

        // Actualizar dispositivo con las rutas de las fotografías (si existen)
        if (fotografia_1 || fotografia_2) {
            await pool.query(
                "UPDATE Dispositivos SET fotografia_1 = ?, fotografia_2 = ? WHERE id = ?",
                [fotografia_1, fotografia_2, dispositivoId]
            );
        }

        // Verificar si todas las etapas están completas
        await verificarYCompletarPazSalvo(id_paz_salvo);

        return res.status(201).json({
            message: "Dispositivo creado correctamente",
            dispositivo_id: dispositivoId,
            id_responsable,
            id_paz_salvo,
            empleado_id: empleadoId,
            fotografia_1: fotografia_1,
            fotografia_2: fotografia_2,
            urls: {
                foto1: fotografia_1 ? `/${fotografia_1}` : null,
                foto2: fotografia_2 ? `/${fotografia_2}` : null
            }
        });
    } catch (error) {
        console.error("createDispositivo:", error);
        return res.status(500).json({ message: "Error al crear dispositivo", error: error.message });
    }
};

/**
 * Eliminar dispositivo (soft delete)
 * DELETE /api/dispositivos/:id
 */
export const deleteDispositivo = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            "UPDATE Dispositivos SET eliminado = TRUE WHERE id = ?",
            [id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }
        return res.json({ message: "Dispositivo eliminado correctamente", id });
    } catch (error) {
        console.error("deleteDispositivo:", error);
        return res.status(500).json({ message: "Error al eliminar dispositivo", error: error.message });
    }
};