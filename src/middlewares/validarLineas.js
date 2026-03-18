import { pool } from "../config/db.js";

/**
 * Middleware para validar que id_responsable e id_paz_salvo existan en la BD
 * antes de crear o actualizar una línea.
 */
export const validarLineas = async (req, res, next) => {
  try {
    const { id_responsable, id_paz_salvo } = req.body || {};

    if (!id_responsable || !id_paz_salvo) {
      return res.status(400).json({
        message: "Se requieren id_responsable e id_paz_salvo",
      });
    }

    // Verificar que el responsable existe
    const [usuario] = await pool.query(
      "SELECT id FROM Usuarios WHERE id = ? AND eliminado = FALSE",
      [id_responsable]
    );
    if (!usuario || usuario.length === 0) {
      return res.status(400).json({ message: "Usuario responsable no encontrado" });
    }

    // Verificar que el paz y salvo existe
    const [pazSalvo] = await pool.query(
      "SELECT id FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
      [id_paz_salvo]
    );
    if (!pazSalvo || pazSalvo.length === 0) {
      return res.status(400).json({ message: "Paz y salvo no encontrado" });
    }

    next();
  } catch (error) {
    console.error("validarLineas:", error);
    return res.status(500).json({
      message: "Error al validar línea",
      error: error.message,
    });
  }
};
