import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

/**
 * Obtener todos los registros de Acronics (no eliminados)
 * GET /api/acronics
 */
export const getAcronics = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT g.*,
                    u.nombres as responsable_nombres, u.apellidos as responsable_apellidos,
                    ps.id_empleado, ps.estado as paz_salvo_estado
             FROM Acronics g
             LEFT JOIN Usuarios u ON g.id_responsable = u.id
             LEFT JOIN PazSalvos ps ON g.id_paz_salvo = ps.id
             WHERE g.eliminado = FALSE
             ORDER BY g.fecha_creacion DESC`
        );
        return res.json(rows);
    } catch (error) {
        console.error("getAcronics:", error);
        return res.status(500).json({ message: "Error al obtener registros de Acronics", error: error.message });
    }
};


/**
 * Obtener un registro de Acronics por ID
 * GET /api/acronics/:id
 */
export const getAcronicsById = async (req, res) => {
	try {
		const { id } = req.params;
		const [rows] = await pool.query(
			`SELECT g.*,
					u.nombres as responsable_nombres, u.apellidos as responsable_apellidos, u.correo as responsable_correo,
					ps.id_empleado, ps.estado as paz_salvo_estado
			 FROM Acronics g
			 LEFT JOIN Usuarios u ON g.id_responsable = u.id
			 LEFT JOIN PazSalvos ps ON g.id_paz_salvo = ps.id
			 WHERE g.id = ? AND g.eliminado = FALSE`,
			[id]
		);
		if (!rows || rows.length === 0) return res.status(404).json({ message: "Registro Acronics no encontrado" });
		return res.json(rows[0]);
	} catch (error) {
		console.error("getAcronicsById:", error);
		return res.status(500).json({ message: "Error al obtener registro Acronics", error: error.message });
	}
};

/**
 * Crear registro de Acronics con fotografías opcionales
 * POST /api/acronics
 */
export const createAcronics = async (req, res) => {
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

		// Crear el registro Acronics (las validaciones ya se hicieron en el middleware)
		const [result] = await pool.query(
			"INSERT INTO Acronics (id_responsable, id_paz_salvo, observaciones) VALUES (?, ?, ?)",
			[id_responsable, id_paz_salvo, observaciones || null]
		);

		const acronicsId = result.insertId;
		let fotografia_1 = null;
		let fotografia_2 = null;

		if (files.fotografia_1 && files.fotografia_1.length > 0) {
			fotografia_1 = `uploads/empleados/${empleadoId}/acronics/${files.fotografia_1[0].filename}`;
		}

		if (files.fotografia_2 && files.fotografia_2.length > 0) {
			fotografia_2 = `uploads/empleados/${empleadoId}/acronics/${files.fotografia_2[0].filename}`;
		}

		// Actualizar con rutas de fotos
		if (fotografia_1 || fotografia_2) {
			await pool.query(
				"UPDATE Acronics SET fotografia_1 = ?, fotografia_2 = ? WHERE id = ?",
				[fotografia_1, fotografia_2, acronicsId]
			);
		}

		// Verificar si todas las etapas están completas
		await verificarYCompletarPazSalvo(id_paz_salvo);

		return res.status(201).json({
			message: "Registro Acronics creado correctamente",
			acronics_id: acronicsId,
			id_responsable,
			id_paz_salvo,
			empleado_id: empleadoId,
			fotografia_1,
			fotografia_2,
			urls: {
				foto1: fotografia_1 ? `/${fotografia_1}` : null,
				foto2: fotografia_2 ? `/${fotografia_2}` : null
			}
		});
	} catch (error) {
		console.error("createAcronics:", error);
		return res.status(500).json({ message: "Error al crear registro Acronics", error: error.message });
	}
};

/**
 * Actualizar registro Acronics (sin imágenes)
 * PUT /api/acronics/:id
 */
export const updateAcronics = async (req, res) => {
	try {
		const { id } = req.params;
		const { id_responsable, id_paz_salvo, observaciones } = req.body;

		// Verificar que existe
		const [acronics] = await pool.query(
			"SELECT id FROM Acronics WHERE id = ? AND eliminado = FALSE",
			[id]
		);
		if (!acronics || acronics.length === 0) {
			return res.status(404).json({ message: "Registro Acronics no encontrado" });
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

		await pool.query(
			"UPDATE Acronics SET id_responsable = COALESCE(?, id_responsable), id_paz_salvo = COALESCE(?, id_paz_salvo), observaciones = COALESCE(?, observaciones) WHERE id = ?",
			[id_responsable || null, id_paz_salvo || null, observaciones || null, id]
		);

		return res.json({ message: "Registro Acronics actualizado", id });
	} catch (error) {
		console.error("updateAcronics:", error);
		return res.status(500).json({ message: "Error al actualizar registro Acronics", error: error.message });
	}
};

/**
 * Eliminar registro Acronics (soft delete)
 * DELETE /api/acronics/:id
 */
export const deleteAcronics = async (req, res) => {
	try {
		const { id } = req.params;
		const [result] = await pool.query(
			"UPDATE Acronics SET eliminado = TRUE WHERE id = ?",
			[id]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ message: "Registro Acronics no encontrado" });
		}
		return res.json({ message: "Registro Acronics eliminado correctamente", id });
	} catch (error) {
		console.error("deleteAcronics:", error);
		return res.status(500).json({ message: "Error al eliminar registro Acronics", error: error.message });
	}
};
