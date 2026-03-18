import { pool } from "../config/db.js";

/**
 * Middleware para validar datos del dispositivo DESPUÉS de procesar multipart/form-data
 * Evita crear registros si los datos requeridos son inválidos
 */
export const validarDispositivo = async (req, res, next) => {
    try {
        const { id_responsable, id_paz_salvo } = req.body || {};

        // Validar que se proporcionaron los campos requeridos
        if (!id_responsable || !id_paz_salvo) {
            return res.status(400).json({ 
                message: "Se requieren id_responsable e id_paz_salvo" 
            });
        }

        // Validar que el responsable existe y no está eliminado
        const [usuario] = await pool.query(
            "SELECT id FROM Usuarios WHERE id = ? AND eliminado = FALSE",
            [id_responsable]
        );
        if (!usuario || usuario.length === 0) {
            return res.status(400).json({ message: "Usuario responsable no encontrado" });
        }

        // Validar que el paz y salvo existe y no está eliminado
        const [pazSalvo] = await pool.query(
            "SELECT id FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
            [id_paz_salvo]
        );
        if (!pazSalvo || pazSalvo.length === 0) {
            return res.status(400).json({ message: "Paz y salvo no encontrado" });
        }

        // Si todo es válido, continuar
        next();
    } catch (error) {
        console.error("validarDispositivo:", error);
        return res.status(500).json({ 
            message: "Error al validar dispositivo", 
            error: error.message 
        });
    }
};
