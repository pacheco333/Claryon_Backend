import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

/**
 * Trae usuarios de 10 en 10 (limit fijo = 10).
 * Query params:
 *  - page (opcional, >=1)
 */
export const getUsuariosPaginated = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 10; // fijo
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM Usuarios WHERE eliminado = FALSE");
        const total = countRows[0]?.total || 0;

        const [rows] = await pool.query(
            "SELECT * FROM Usuarios WHERE eliminado = FALSE ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        return res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            results: rows
        });
    } catch (error) {
        console.error("getUsuariosPaginated:", error);
        return res.status(500).json({ message: "Error al obtener usuarios paginados", error: error.message });
    }
};

/**
 * Trae usuarios aplicando filtros dinámicos y paginación opcional.
 * Query params admitidos (todos opcionales):
 *  - page, limit
 *  - nombres (busca LIKE)
 *  - apellidos (busca LIKE)
 *  - correo (busca LIKE)
 *  - rol (igual)
 *  - activo (true|false)
 *  - Fecha_Creacion
 */
/*export const getUsuariosFiltered = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const offset = (page - 1) * limit;

        const filters = [];
        const params = [];

        if (req.query.nombres) {
            filters.push("LOWER(nombres) LIKE ?");
            params.push(`%${String(req.query.nombres).trim().toLowerCase()}%`);
        }
        if (req.query.apellidos) {
            filters.push("LOWER(apellidos) LIKE ?");
            params.push(`%${String(req.query.apellidos).trim().toLowerCase()}%`);
        }
        if (req.query.correo) {
            filters.push("LOWER(correo) LIKE ?");
            params.push(`%${String(req.query.correo).trim().toLowerCase()}%`);
        }
        if (req.query.rol) {
            filters.push("rol = ?");
            params.push(req.query.rol);
        }
        if (typeof req.query.activo !== "undefined") {
            const val = String(req.query.activo).toLowerCase();
            if (val === "true" || val === "1") {
                filters.push("activo = ?");
                params.push(1);
            } else if (val === "false" || val === "0") {
                filters.push("activo = ?");
                params.push(0);
            } else {
                return res.status(400).json({ message: "activo debe ser true/false" });
            }
        }
        if (req.query.desde) {
            filters.push("fecha_creacion >= ?");
            params.push(req.query.desde);
        }
        if (req.query.hasta) {
            filters.push("fecha_creacion <= ?");
            params.push(req.query.hasta);
        }

        const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

        const countSql = `SELECT COUNT(*) AS total FROM Usuarios ${whereSql}`;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total || 0;

        const dataSql = `SELECT * FROM Usuarios ${whereSql} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?`;
        const dataParams = [...params, limit, offset];
        const [rows] = await pool.query(dataSql, dataParams);

        return res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            results: rows
        });
    } catch (error) {
        console.error("getUsuariosFiltered:", error);
        return res.status(500).json({ message: "Error al obtener usuarios filtrados", error: error.message });
    }
};*/

/**
    * Crea un nuevo usuario.
    *   Body params esperados:
    *   - obligatorios:  
    *       Id
    *       nombres
    *       apellidos
    *       correo
    *       contrasena 
 */
export const postUsuarios = async (req, res) => {
    try {
        const { contrasena, ...rest } = req.body;
        if (!contrasena) return res.status(400).json({ message: "contrasena es requerida" });

        const saltRounds = 10;
        const hashed = await bcrypt.hash(contrasena, saltRounds);

        const insertData = { ...rest, contrasena: hashed };
        const [result] = await pool.query("INSERT INTO Usuarios SET ?", [insertData]);

        return res.status(201).json({ message: "Usuario creado"});
    } catch (error) {
        console.error("postUsuarios:", error);
        return res.status(500).json({ message: "Error al crear usuario", error: error.message });
    }
};



export const getUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM Usuarios WHERE id = ? AND eliminado = FALSE", [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getUsuarioPorId:", error);
        return res.status(500).json({ message: "Error al obtener usuario", error: error.message });
    }
};

export const putUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (req.file) {
            updateData.firma = `/uploads/firmas/${id}/${req.file.filename}`;
        }

        if (updateData.contrasena) {
            const alreadyHashed = /^\$2[aby]\$\d{2}\$/.test(updateData.contrasena);
            if (!alreadyHashed) {
                updateData.contrasena = await bcrypt.hash(updateData.contrasena, 10);
            }
        }

        const [result] = await pool.query("UPDATE Usuarios SET ? WHERE id = ?", [updateData, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        return res.json({ message: "Usuario actualizado", id });
    } catch (error) {
        console.error("putUsuario:", error);
        return res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
    }
};

export const deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Usuarios SET eliminado = TRUE WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        return res.json({ message: "Usuario eliminado correctamente", id });
    } catch (error) {
        console.error("deleteUsuario:", error);
        return res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
    }
};

