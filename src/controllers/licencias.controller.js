import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

export const getLicencias = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM Licencias WHERE eliminado = FALSE ORDER BY fecha_creacion DESC");
        return res.json(rows);
    } catch (error) {
        console.error("getLicencias:", error);
        return res.status(500).json({ message: "Error al obtener licencias", error: error.message });
    }
};

export const getLicenciaById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM Licencias WHERE id = ? AND eliminado = FALSE", [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Licencia no encontrada" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getLicenciaById:", error);
        return res.status(500).json({ message: "Error al obtener licencia", error: error.message });
    }
};

/**
 * Actualizar registro de Licencias — etapas idrive, sap u otras-licencias
 * PUT /api/licencias/:id  (multipart/form-data)
 *
 * Solo actualiza los campos presentes en el body / archivos subidos.
 */
// export const updateLicencia = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const files = req.files || {};

//         // Verificar que existe y obtener empleadoId para construir paths
//         const [licencias] = await pool.query(
//             `SELECT l.id, ps.id_empleado
//              FROM Licencias l
//              JOIN PazSalvos ps ON l.id_paz_salvo = ps.id
//              WHERE l.id = ? AND l.eliminado = FALSE`,
//             [id]
//         );
//         if (!licencias || licencias.length === 0) {
//             return res.status(404).json({ message: "Licencia no encontrada" });
//         }
//         const empleadoId = licencias[0].id_empleado;

//         // Copiar campos del body (excluir campos vacíos para no pisar datos)
//         const updateData = { ...req.body };

//         // Procesar archivos subidos y añadirlos al update
//         const fileFields = [
//             'fotografia_antivirus',
//             'fotografia_copia_seguridad',
//             'fotografia_erp',
//             'fotografia_otras_licencias',
//         ];
//         const fileUrls = {};
//         for (const fieldName of fileFields) {
//             if (files[fieldName] && files[fieldName].length > 0) {
//                 const filePath = `uploads/empleados/${empleadoId}/licencias/${files[fieldName][0].filename}`;
//                 updateData[fieldName] = filePath;
//                 fileUrls[fieldName] = `/${filePath}`;
//             }
//         }

//         if (Object.keys(updateData).length === 0) {
//             return res.status(400).json({ message: "No hay datos para actualizar" });
//         }

//         const [result] = await pool.query("UPDATE Licencias SET ? WHERE id = ?", [updateData, id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "Licencia no encontrada" });
//         }

//         // Obtener id_paz_salvo para verificar si el proceso está completo
//         const [[licRow]] = await pool.query(
//             "SELECT id_paz_salvo FROM Licencias WHERE id = ?",
//             [id]
//         );
//         if (licRow) {
//             await verificarYCompletarPazSalvo(licRow.id_paz_salvo);
//         }

//         return res.json({ message: "Licencia actualizada", id, ...fileUrls });
//     } catch (error) {
//         console.error("updateLicencia:", error);
//         return res.status(500).json({ message: "Error al actualizar licencia", error: error.message });
//     }
// };


/**
 * Upsert registro de Licencias — cualquier etapa (antivirus, idrive, sap, otras-licencias)
 * POST /api/licencias/upsert  (multipart/form-data)
 *
 * Campo requerido: id_paz_salvo
 * Campos opcionales (según la etapa que invoque):
 *   responsable_antivirus, fotografia_antivirus, observaciones_antivirus,
 *   responsable_copia_seguridad, fotografia_copia_seguridad, observaciones_copia_seguridad,
 *   responsable_erp, fotografia_erp, observaciones_erp,
 *   responsable_otras_licencias, otras_licencias, fotografia_otras_licencias, observaciones_otras_licencias
 *
 * Si ya existe un registro de Licencias para ese paz_salvo, lo actualiza.
 * Si no existe, lo crea. Devuelve el id del registro.
 */

export const upsertLicencia = async (req, res) => {
    try {
        const { id_paz_salvo } = req.body;
        const files = req.files || {};

        if (!id_paz_salvo) {
            return res.status(400).json({ message: "id_paz_salvo es requerido" });
        }

        // Obtener el empleado vinculado al paz y salvo (para rutas de archivos)
        const [pazSalvo] = await pool.query(
            "SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
            [id_paz_salvo]
        );
        if (!pazSalvo || pazSalvo.length === 0) {
            return res.status(400).json({ message: "Paz y Salvo no encontrado" });
        }
        const empleadoId = pazSalvo[0].id_empleado;

        // Construir objeto con los campos permitidos del body
        const updateData = {};
        const allowedFields = [
            'responsable_antivirus', 'observaciones_antivirus',
            'responsable_copia_seguridad', 'observaciones_copia_seguridad',
            'responsable_erp', 'observaciones_erp',
            'responsable_otras_licencias', 'otras_licencias', 'observaciones_otras_licencias',
        ];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                updateData[field] = req.body[field];
            }
        }

        // Procesar archivos subidos
        const fileFields = [
            'fotografia_antivirus',
            'fotografia_copia_seguridad',
            'fotografia_erp',
            'fotografia_otras_licencias',
        ];
        const fileUrls = {};
        for (const fieldName of fileFields) {
            if (files[fieldName] && files[fieldName].length > 0) {
                const filePath = `uploads/empleados/${empleadoId}/licencias/${files[fieldName][0].filename}`;
                updateData[fieldName] = filePath;
                fileUrls[fieldName] = `/${filePath}`;
            }
        }

        // Verificar si ya existe un registro para este paz y salvo
        const [existing] = await pool.query(
            "SELECT id FROM Licencias WHERE id_paz_salvo = ? AND eliminado = FALSE",
            [id_paz_salvo]
        );

        let licenciaId;
        if (existing && existing.length > 0) {
            // UPDATE registro existente
            licenciaId = existing[0].id;
            if (Object.keys(updateData).length > 0) {
                await pool.query("UPDATE Licencias SET ? WHERE id = ?", [updateData, licenciaId]);
            }
        } else {
            // INSERT nuevo registro
            const insertData = { id_paz_salvo, ...updateData };
            const [result] = await pool.query("INSERT INTO Licencias SET ?", [insertData]);
            licenciaId = result.insertId;
        }

        // Verificar si el paz y salvo está completo
        await verificarYCompletarPazSalvo(id_paz_salvo);

        return res.status(200).json({
            message: "Licencia guardada",
            id: licenciaId,
            ...fileUrls,
        });
    } catch (error) {
        console.error("upsertLicencia:", error);
        return res.status(500).json({ message: "Error al guardar licencia", error: error.message });
    }
};

export const deleteLicencia = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Licencias SET eliminado = TRUE WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Licencia no encontrada" });
        return res.json({ message: "Licencia eliminada correctamente", id });
    } catch (error) {
        console.error("deleteLicencia:", error);
        return res.status(500).json({ message: "Error al eliminar licencia", error: error.message });
    }
};