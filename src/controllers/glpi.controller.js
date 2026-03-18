import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

/**
 * Obtener todos los registros de GLPI (no eliminados)
 * GET /api/glpi
 */
export const getGlpi = async (req, res) => {
	try {
		const [rows] = await pool.query(
			`SELECT g.*, 
					u.nombres as responsable_nombres, u.apellidos as responsable_apellidos,
					ps.id_empleado, ps.estado as paz_salvo_estado
			 FROM Glpi g
			 LEFT JOIN Usuarios u ON g.id_responsable = u.id
			 LEFT JOIN PazSalvos ps ON g.id_paz_salvo = ps.id
			 WHERE g.eliminado = FALSE
			 ORDER BY g.fecha_creacion DESC`
		);
		return res.json(rows);
	} catch (error) {
		console.error("getGlpi:", error);
		return res.status(500).json({ message: "Error al obtener registros GLPI", error: error.message });
	}
};

/**
 * Obtener un registro de GLPI por ID
 * GET /api/glpi/:id
 */
export const getGlpiById = async (req, res) => {
	try {
		const { id } = req.params;
		const [rows] = await pool.query(
			`SELECT g.*,
					u.nombres as responsable_nombres, u.apellidos as responsable_apellidos, u.correo as responsable_correo,
					ps.id_empleado, ps.estado as paz_salvo_estado
			 FROM Glpi g
			 LEFT JOIN Usuarios u ON g.id_responsable = u.id
			 LEFT JOIN PazSalvos ps ON g.id_paz_salvo = ps.id
			 WHERE g.id = ? AND g.eliminado = FALSE`,
			[id]
		);
		if (!rows || rows.length === 0) return res.status(404).json({ message: "Registro GLPI no encontrado" });
		return res.json(rows[0]);
	} catch (error) {
		console.error("getGlpiById:", error);
		return res.status(500).json({ message: "Error al obtener registro GLPI", error: error.message });
	}
};

/**
 * Crear registro de GLPI con fotografías opcionales
 * POST /api/glpi
 */
export const createGlpi = async (req, res) => {
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

		// Crear el registro GLPI (las validaciones ya se hicieron en el middleware)
		const [result] = await pool.query(
			"INSERT INTO Glpi (id_responsable, id_paz_salvo, observaciones) VALUES (?, ?, ?)",
			[id_responsable, id_paz_salvo, observaciones || null]
		);

		const glpiId = result.insertId;
		let fotografia_1 = null;
		let fotografia_2 = null;

		if (files.fotografia_1 && files.fotografia_1.length > 0) {
			fotografia_1 = `uploads/empleados/${empleadoId}/glpi/${files.fotografia_1[0].filename}`;
		}

		if (files.fotografia_2 && files.fotografia_2.length > 0) {
			fotografia_2 = `uploads/empleados/${empleadoId}/glpi/${files.fotografia_2[0].filename}`;
		}

		// Actualizar con rutas de fotos
		if (fotografia_1 || fotografia_2) {
			await pool.query(
				"UPDATE Glpi SET fotografia_1 = ?, fotografia_2 = ? WHERE id = ?",
				[fotografia_1, fotografia_2, glpiId]
			);
		}

		// Verificar si todas las etapas están completas
		await verificarYCompletarPazSalvo(id_paz_salvo);

		return res.status(201).json({
			message: "Registro GLPI creado correctamente",
			glpi_id: glpiId,
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
		console.error("createGlpi:", error);
		return res.status(500).json({ message: "Error al crear registro GLPI", error: error.message });
	}
};

/**
 * Actualizar registro GLPI (sin imágenes)
 * PUT /api/glpi/:id
 */
export const updateGlpi = async (req, res) => {
	try {
		const { id } = req.params;
		const { id_responsable, id_paz_salvo, observaciones } = req.body;

		// Verificar que existe
		const [glpi] = await pool.query(
			"SELECT id FROM Glpi WHERE id = ? AND eliminado = FALSE",
			[id]
		);
		if (!glpi || glpi.length === 0) {
			return res.status(404).json({ message: "Registro GLPI no encontrado" });
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
			"UPDATE Glpi SET id_responsable = COALESCE(?, id_responsable), id_paz_salvo = COALESCE(?, id_paz_salvo), observaciones = COALESCE(?, observaciones) WHERE id = ?",
			[id_responsable || null, id_paz_salvo || null, observaciones || null, id]
		);

		return res.json({ message: "Registro GLPI actualizado", id });
	} catch (error) {
		console.error("updateGlpi:", error);
		return res.status(500).json({ message: "Error al actualizar registro GLPI", error: error.message });
	}
};

/**
 * Eliminar registro GLPI (soft delete)
 * DELETE /api/glpi/:id
 */
export const deleteGlpi = async (req, res) => {
	try {
		const { id } = req.params;
		const [result] = await pool.query(
			"UPDATE Glpi SET eliminado = TRUE WHERE id = ?",
			[id]
		);
		if (result.affectedRows === 0) {
			return res.status(404).json({ message: "Registro GLPI no encontrado" });
		}
		return res.json({ message: "Registro GLPI eliminado correctamente", id });
	} catch (error) {
		console.error("deleteGlpi:", error);
		return res.status(500).json({ message: "Error al eliminar registro GLPI", error: error.message });
	}
};
