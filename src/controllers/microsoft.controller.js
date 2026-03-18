import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

export const getMicrosoft = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Plataformas WHERE eliminado = FALSE ORDER BY fecha_creacion DESC");
        return res.json(rows);
    } catch (error) {
        console.error("getMicrosoft:", error);
        return res.status(500).json({ message: "Error al obtener registros Microsoft", error: error.message });
    }
};

export const getMicrosoftById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM Plataformas WHERE id = ? AND eliminado = FALSE", [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Registro Microsoft no encontrado" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getMicrosoftById:", error);
        return res.status(500).json({ message: "Error al obtener registro Microsoft", error: error.message });
    }
};

export const createMicrosoft = async (req, res) => {
    try {
        const { id_responsable, id_paz_salvo, observaciones } = req.body;
        const files = req.files || {};

        if (!id_responsable || !id_paz_salvo) {
            return res.status(400).json({ message: "id_responsable y id_paz_salvo son requeridos" });
        }

        // Verificar que el paz y salvo existe y obtener el id_empleado
        const [pazSalvo] = await pool.query(
            "SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
            [id_paz_salvo]
        );
        if (!pazSalvo || pazSalvo.length === 0) {
            return res.status(400).json({ message: "Paz y salvo no encontrado" });
        }

        const empleadoId = pazSalvo[0].id_empleado;

        // Insertar registro base en Plataformas
        const [result] = await pool.query(
            "INSERT INTO Plataformas (id_responsable, id_paz_salvo, observaciones) VALUES (?, ?, ?)",
            [id_responsable, id_paz_salvo, observaciones || null]
        );

        const plataformaId = result.insertId;
        let fotografia_onedrive = null;
        let fotografia_buzon = null;

        // Construir ruta de la fotografía OneDrive
        if (files.fotografia_onedrive && files.fotografia_onedrive.length > 0) {
            fotografia_onedrive = `uploads/empleados/${empleadoId}/plataformas/${files.fotografia_onedrive[0].filename}`;
        }

        // Construir ruta de la fotografía Buzón
        if (files.fotografia_buzon && files.fotografia_buzon.length > 0) {
            fotografia_buzon = `uploads/empleados/${empleadoId}/plataformas/${files.fotografia_buzon[0].filename}`;
        }

        // Actualizar el registro con las rutas de las fotografías
        if (fotografia_onedrive || fotografia_buzon) {
            await pool.query(
                "UPDATE Plataformas SET fotografia_onedrive = ?, fotografia_buzon = ? WHERE id = ?",
                [fotografia_onedrive, fotografia_buzon, plataformaId]
            );
        }

        // Verificar si todas las etapas están completas
        await verificarYCompletarPazSalvo(id_paz_salvo);

        return res.status(201).json({
            message: "Registro Microsoft creado correctamente",
            plataforma_id: plataformaId,
            id_responsable,
            id_paz_salvo,
            empleado_id: empleadoId,
            fotografia_onedrive,
            fotografia_buzon,
            urls: {
                onedrive: fotografia_onedrive ? `/${fotografia_onedrive}` : null,
                buzon: fotografia_buzon ? `/${fotografia_buzon}` : null
            }
        });
    } catch (error) {
        console.error("createMicrosoft:", error);
        return res.status(500).json({ message: "Error al crear registro Microsoft", error: error.message });
    }
};

export const updateMicrosoft = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Plataformas SET ? WHERE id = ?", [req.body, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Registro Microsoft no encontrado" });
        return res.json({ message: "Registro Microsoft actualizado", id });
    } catch (error) {
        console.error("updateMicrosoft:", error);
        return res.status(500).json({ message: "Error al actualizar registro Microsoft", error: error.message });
    }
};

export const deleteMicrosoft = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Plataformas SET eliminado = TRUE WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Registro Microsoft no encontrado" });
        return res.json({ message: "Registro Microsoft eliminado correctamente", id });
    } catch (error) {
        console.error("deleteMicrosoft:", error);
        return res.status(500).json({ message: "Error al eliminar registro Microsoft", error: error.message });
    }
};