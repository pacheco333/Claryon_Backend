import { pool } from "../config/db.js";

// Permisos disponibles en el sistema
const PERMISOS_DISPONIBLES = [
    "Administrador",
    "Equipos",
    "Lineas",
    "Antivirus",
    "Correo",
    "Idrive",
    "SAP"
];

/**
 * Obtener permisos de un usuario
 * GET /api/permisos/:id
 */
export const getPermisosByUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que el usuario existe y no está eliminado
        const [usuario] = await pool.query(
            "SELECT id FROM Usuarios WHERE id = ? AND eliminado = FALSE",
            [id]
        );
        if (!usuario || usuario.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Obtener permisos del usuario
        const [permisos] = await pool.query(
            "SELECT id, Permisos FROM Permisos_Usuario WHERE id_usuario = ?",
            [id]
        );

        if (!permisos || permisos.length === 0) {
            return res.json({ 
                id_usuario: id, 
                permisos: [],
                mensaje: "El usuario no tiene permisos asignados"
            });
        }

        const permisosArray = permisos[0].Permisos
            ? permisos[0].Permisos.split(',').map(p => p.trim()).filter(p => p)
            : [];

        return res.json({
            id_usuario: id,
            permisos: permisosArray,
            permiso_id: permisos[0].id
        });
    } catch (error) {
        console.error("getPermisosByUsuario:", error);
        return res.status(500).json({ 
            message: "Error al obtener permisos del usuario", 
            error: error.message 
        });
    }
};

/**
 * Crear o asignar permisos a un usuario
 * POST /api/permisos/:id
 * Body: { permisos: ["Equipos", "Lineas"] }
 */
export const crearPermisos = async (req, res) => {
    try {
        const { id } = req.params;
        const { permisos } = req.body;

        // Validar que permisos es un array
        if (!Array.isArray(permisos) || permisos.length === 0) {
            return res.status(400).json({ 
                message: "permisos debe ser un array no vacío" 
            });
        }

        // Validar que todos los permisos existen
        const permisosInvalidos = permisos.filter(p => !PERMISOS_DISPONIBLES.includes(p));
        if (permisosInvalidos.length > 0) {
            return res.status(400).json({ 
                message: `Permisos inválidos: ${permisosInvalidos.join(", ")}. Disponibles: ${PERMISOS_DISPONIBLES.join(", ")}`
            });
        }

        // Verificar que el usuario existe y no está eliminado
        const [usuario] = await pool.query(
            "SELECT id FROM Usuarios WHERE id = ? AND eliminado = FALSE",
            [id]
        );
        if (!usuario || usuario.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Convertir array a string separado por comas
        const permisosStr = permisos.join(",");

        // Verificar si ya existen permisos para este usuario
        const [existentes] = await pool.query(
            "SELECT id FROM Permisos_Usuario WHERE id_usuario = ?",
            [id]
        );

        if (existentes && existentes.length > 0) {
            // Actualizar permisos existentes
            await pool.query(
                "UPDATE Permisos_Usuario SET Permisos = ? WHERE id_usuario = ?",
                [permisosStr, id]
            );
            return res.json({ 
                message: "Permisos actualizados correctamente",
                id_usuario: id,
                permisos: permisos
            });
        } else {
            // Crear nuevos permisos
            const [result] = await pool.query(
                "INSERT INTO Permisos_Usuario (Permisos, id_usuario) VALUES (?, ?)",
                [permisosStr, id]
            );
            return res.status(201).json({ 
                message: "Permisos asignados correctamente",
                id_usuario: id,
                permisos: permisos,
            });
        }
    } catch (error) {
        console.error("crearPermisos:", error);
        return res.status(500).json({ 
            message: "Error al asignar permisos", 
            error: error.message 
        });
    }
};


/**
 * Remover un permiso de un usuario
 * DELETE /api/permisos/:id/remover/:permiso
 */
export const removerPermiso = async (req, res) => {
    try {
        const { id, permiso } = req.params;

        if (!permiso || !PERMISOS_DISPONIBLES.includes(permiso)) {
            return res.status(400).json({ 
                message: `Permiso inválido. Disponibles: ${PERMISOS_DISPONIBLES.join(", ")}`
            });
        }

        // Obtener permisos actuales
        const [permisos] = await pool.query(
            "SELECT Permisos FROM Permisos_Usuario WHERE id_usuario = ?",
            [id]
        );

        if (!permisos || permisos.length === 0) {
            return res.status(404).json({ message: "Usuario sin permisos registrados" });
        }

        const permisosActuales = permisos[0].Permisos
            ? permisos[0].Permisos.split(',').map(p => p.trim()).filter(p => p)
            : [];

        // Verificar si el permiso existe
        if (!permisosActuales.includes(permiso)) {
            return res.status(400).json({ 
                message: `El usuario no tiene el permiso: ${permiso}`
            });
        }

        // Remover el permiso
        const permisosActualizados = permisosActuales.filter(p => p !== permiso);
        
        if (permisosActualizados.length === 0) {
            return res.status(400).json({ 
                message: "No se puede eliminar todos los permisos. Un usuario debe tener al menos un permiso."
            });
        }

        const permisosStr = permisosActualizados.join(",");

        await pool.query(
            "UPDATE Permisos_Usuario SET Permisos = ? WHERE id_usuario = ?",
            [permisosStr, id]
        );

        return res.json({ 
            message: `Permiso ${permiso} removido correctamente`,
            id_usuario: id,
            permisos: permisosActualizados
        });
    } catch (error) {
        console.error("removerPermiso:", error);
        return res.status(500).json({ 
            message: "Error al remover permiso", 
            error: error.message 
        });
    }
};
