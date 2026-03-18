import { Result } from "express-validator";
import { pool } from "../config/db.js";

/*export const getEmpleadosFiltered = async (req, res) => {

    console.log("getEmpleadosFiltered called with query:", req.query);

    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const offset = (page - 1) * limit;

        const filters = [];
        const params = [];

        if (req.query.id !== undefined && req.query.id !== "") {
            const id = Number(req.query.id);
            if (!Number.isNaN(id)) {
                filters.push("id = ?");
                params.push(id);
            }
        }

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

        if (req.query.desde) {
            filters.push("fecha_creacion >= ?");
            params.push(req.query.desde);
        }
        if (req.query.hasta) {
            filters.push("fecha_creacion <= ?");
            params.push(req.query.hasta);
        }

        const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

        const countSql = `SELECT COUNT(*) AS total FROM Empleados ${whereSql}`;
        const [countRows] = await pool.query(countSql, params);
        const total = countRows[0]?.total || 0;

        const dataSql = `SELECT * FROM Empleados ${whereSql} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?`;
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
        console.error("getEmpleadosFiltered:", error);
        return res.status(500).json({ message: "Error al obtener empleados filtrados", error: error.message });
    }
};*/

export const getEmpleadosPaginated = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 10; // fijo
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM Empleados WHERE eliminado = FALSE");
        const total = countRows[0]?.total || 0;

        const [rows] = await pool.query(
            "SELECT * FROM Empleados WHERE eliminado = FALSE ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?",
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
        console.error("getEmpeladosPaginated:", error);
        return res.status(500).json({ message: "Error al obtener empleados paginados", error: error.message });
    }
};

export const postEmpleados = async (req, res) => {
    try {

        
        const [result] = await pool.query("INSERT INTO Empleados SET ?", [req.body]);
        return res.status(201).json({ message: "Empleado creado 😎"});


    } catch (error) {
        console.error("postEmpleados:", error);
        return res.status(500).json({ message: "Error al crear empleado", error: error.message });
    }
};

export const getEmpleadoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM Empleados WHERE id = ? AND eliminado = FALSE", [id]);
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Empleado no encontrado" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getEmpleadoPorId:", error);
        return res.status(500).json({ message: "Error al obtener empleado", error: error.message });
    }
};

export const putEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Empleados SET ? WHERE id = ?", [req.body, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Empleado no encontrado" });
        return res.json({ message: "Empleado actualizado", id });
    } catch (error) {
        console.error("putEmpleado:", error);
        return res.status(500).json({ message: "Error al actualizar empleado", error: error.message });
    }
};

export const deleteEmpleado = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE Empleados SET eliminado = TRUE WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Empleado no encontrado" });
        return res.json({ message: "Empleado eliminado correctamente", id });
    } catch (error) {
        console.error("deleteEmpleado:", error);
        return res.status(500).json({ message: "Error al eliminar empleado", error: error.message });
    }
};