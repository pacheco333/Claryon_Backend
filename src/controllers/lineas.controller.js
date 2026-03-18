import { pool } from "../config/db.js";
import { verificarYCompletarPazSalvo } from "../utils/completarPazSalvo.js";

/**
 * Obtener todas las líneas (no eliminadas)
 * GET /api/lineas
 */
export const getLineas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*,
              u.nombres AS responsable_nombres, u.apellidos AS responsable_apellidos,
              ps.id_empleado, ps.estado AS paz_salvo_estado
       FROM Lineas l
       LEFT JOIN Usuarios u ON l.id_responsable = u.id
       LEFT JOIN PazSalvos ps ON l.id_paz_salvo = ps.id
       WHERE l.eliminado = FALSE
       ORDER BY l.fecha_creacion DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error("getLineas:", error);
    return res.status(500).json({ message: "Error al obtener líneas", error: error.message });
  }
};

/**
 * Obtener una línea por ID
 * GET /api/lineas/:id
 */
export const getLineaById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT l.*,
              u.nombres AS responsable_nombres, u.apellidos AS responsable_apellidos,
              ps.id_empleado, ps.estado AS paz_salvo_estado
       FROM Lineas l
       LEFT JOIN Usuarios u ON l.id_responsable = u.id
       LEFT JOIN PazSalvos ps ON l.id_paz_salvo = ps.id
       WHERE l.id = ? AND l.eliminado = FALSE`,
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Línea no encontrada" });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error("getLineaById:", error);
    return res.status(500).json({ message: "Error al obtener línea", error: error.message });
  }
};

/**
 * Obtener la línea asociada a un paz y salvo
 * GET /api/lineas/paz-salvo/:id_paz_salvo
 */
export const getLineaByPazSalvo = async (req, res) => {
  try {
    const { id_paz_salvo } = req.params;
    const [rows] = await pool.query(
      `SELECT l.*,
              u.nombres AS responsable_nombres, u.apellidos AS responsable_apellidos
       FROM Lineas l
       LEFT JOIN Usuarios u ON l.id_responsable = u.id
       WHERE l.id_paz_salvo = ? AND l.eliminado = FALSE
       ORDER BY l.fecha_creacion DESC`,
      [id_paz_salvo]
    );
    return res.json(rows);
  } catch (error) {
    console.error("getLineaByPazSalvo:", error);
    return res.status(500).json({ message: "Error al obtener línea por paz y salvo", error: error.message });
  }
};

/**
 * Crear una nueva línea
 * POST /api/lineas
 */
export const createLinea = async (req, res) => {
  try {
    const { id_responsable, id_paz_salvo, numero_linea, observaciones } = req.body;

    const [result] = await pool.query(
      "INSERT INTO Lineas (id_responsable, id_paz_salvo, numero_linea, observaciones) VALUES (?, ?, ?, ?)",
      [id_responsable, id_paz_salvo, numero_linea ?? null, observaciones ?? null]
    );

    // Verificar si todas las etapas están completas
    await verificarYCompletarPazSalvo(id_paz_salvo);

    return res.status(201).json({
      message: "Línea creada correctamente",
      linea_id: result.insertId,
      id_responsable,
      id_paz_salvo,
      numero_linea: numero_linea ?? null,
      observaciones: observaciones ?? null,
    });
  } catch (error) {
    console.error("createLinea:", error);
    return res.status(500).json({ message: "Error al crear línea", error: error.message });
  }
};

/**
 * Actualizar una línea
 * PUT /api/lineas/:id
 */
export const updateLinea = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_responsable, id_paz_salvo, numero_linea, observaciones } = req.body;

    const [linea] = await pool.query(
      "SELECT id FROM Lineas WHERE id = ? AND eliminado = FALSE",
      [id]
    );
    if (!linea || linea.length === 0) {
      return res.status(404).json({ message: "Línea no encontrada" });
    }

    await pool.query(
      `UPDATE Lineas
       SET id_responsable = COALESCE(?, id_responsable),
           id_paz_salvo   = COALESCE(?, id_paz_salvo),
           numero_linea   = COALESCE(?, numero_linea),
           observaciones  = COALESCE(?, observaciones)
       WHERE id = ?`,
      [id_responsable ?? null, id_paz_salvo ?? null, numero_linea ?? null, observaciones ?? null, id]
    );

    return res.json({ message: "Línea actualizada correctamente", id });
  } catch (error) {
    console.error("updateLinea:", error);
    return res.status(500).json({ message: "Error al actualizar línea", error: error.message });
  }
};

/**
 * Eliminar una línea (soft delete)
 * DELETE /api/lineas/:id
 */
export const deleteLinea = async (req, res) => {
  try {
    const { id } = req.params;

    const [linea] = await pool.query(
      "SELECT id FROM Lineas WHERE id = ? AND eliminado = FALSE",
      [id]
    );
    if (!linea || linea.length === 0) {
      return res.status(404).json({ message: "Línea no encontrada" });
    }

    await pool.query("UPDATE Lineas SET eliminado = TRUE WHERE id = ?", [id]);

    return res.json({ message: "Línea eliminada correctamente", id });
  } catch (error) {
    console.error("deleteLinea:", error);
    return res.status(500).json({ message: "Error al eliminar línea", error: error.message });
  }
};
