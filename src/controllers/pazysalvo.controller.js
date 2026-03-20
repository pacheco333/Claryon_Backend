import { pool } from "../config/db.js";
import { ETAPAS_CONFIG } from "../utils/etapasConfig.js";

const buildEtapasCompletadasSql = (config) => {
    if (!Array.isArray(config) || config.length === 0) return "0";
    return `(${config
        .map((etapa) => `IF(EXISTS(${etapa.completadoSubquery}), 1, 0)`)
        .join(" + ")})`;
};

const etapasCompletadasSql = buildEtapasCompletadasSql(ETAPAS_CONFIG);
const totalEtapas = Array.isArray(ETAPAS_CONFIG) ? ETAPAS_CONFIG.length : 0;

const baseSelect = `ps.*,
    e.nombres, e.apellidos, e.correo, e.puesto, e.compania, e.area,
    TRIM(CONCAT(IFNULL(u.nombres,''), ' ', IFNULL(u.apellidos,''))) AS creado_por_nombre,
    ${etapasCompletadasSql} AS etapas_completadas,
    ${totalEtapas} AS total_etapas`;

const baseJoins = `FROM PazSalvos ps
    LEFT JOIN Empleados e ON ps.id_empleado = e.id
    LEFT JOIN Usuarios u ON ps.id_creado_por = u.id`;

/**
 * Este endpoint me trae los paz y salvos en páginas de 10.
 *
 * Me devuelve, además de la info del paz y salvo, un conteo de cuántas etapas tiene cada proceso y cuántas ha completado.
 * verifica si al menos hay un registro en cada una de las tablas
 * en licencias,verifica si hay un responsable en cada etapa (antivirus, idrive, sap, otras_licencias), si existe registro en id_responsable.
 */

export const getPazysalvosPaginated = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = 10; // fijo

        const [countRows] = await pool.query(
            "SELECT COUNT(*) AS total FROM PazSalvos WHERE estado != 'Anulado' AND eliminado = FALSE"
        );
        const total = countRows[0]?.total || 0;
        const totalPages = total ? Math.ceil(total / limit) : 0;
        const currentPage = totalPages && page > totalPages ? totalPages : page;
        const offset = (currentPage - 1) * limit;

        const [rows] = await pool.query(
            `SELECT ${baseSelect}
             ${baseJoins}
             WHERE ps.estado != 'Anulado' AND ps.eliminado = FALSE
             ORDER BY ps.fecha_creacion DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return res.json({
            page: currentPage,
            limit,
            total,
            totalPages,
            results: rows
        });
    } catch (error) {
        console.error("getPazysalvosPaginated:", error);
        return res.status(500).json({ message: "Error al obtener paz y salvos paginados", error: error.message });
    }
};

/**
 * Este endpoint me trae un paz y salvo específico por `id`.
* Tambienme devuelve un conteo de cuántas etapas tiene el proceso y cuántas ha completado.
 */
export const getPazysalvoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT ${baseSelect}
             ${baseJoins}
             WHERE ps.id = ? AND ps.estado != 'Anulado' AND ps.eliminado = FALSE`,
            [id]
        );
        if (!rows || rows.length === 0) return res.status(404).json({ message: "Paz y salvo no encontrado" });
        return res.json(rows[0]);
    } catch (error) {
        console.error("getPazysalvoById:", error);
        return res.status(500).json({ message: "Error al obtener paz y salvo", error: error.message });
    }
};

export const createPazysalvo = async (req, res) => {
    try {
        const { id_empleado, fecha_inicio, fecha_fin, estado, observaciones } = req.body;
        const id_creado_por = req.user?.id || null;

        // Validar que el empleado existe
        const [empleado] = await pool.query("SELECT id FROM Empleados WHERE id = ?", [id_empleado]);
        if (!empleado || empleado.length === 0) {
            return res.status(400).json({ message: `El empleado con id ${id_empleado} no existe` });
        }

        // Crear paz y salvo //campo nuevo del creador -----------------------------------
        const [result] = await pool.query(
            "INSERT INTO PazSalvos (id_empleado, id_creado_por, fecha_inicio, fecha_fin, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?)",
            [id_empleado, id_creado_por, fecha_inicio, fecha_fin || null, estado || "En Proceso", observaciones || null]
        );
        return res.status(201).json({ message: "Paz y salvo creado", id: result.insertId });
    } catch (error) {
        console.error("createPazysalvo:", error);
        return res.status(500).json({ message: "Error al crear paz y salvo", error: error.message });
    }
};

export const updatePazysalvo = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("UPDATE PazSalvos SET ? WHERE id = ?", [req.body, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Paz y salvo no encontrado" });
        return res.json({ message: "Paz y salvo actualizado", id });
    } catch (error) {
        console.error("updatePazysalvo:", error);
        return res.status(500).json({ message: "Error al actualizar paz y salvo", error: error.message });
    }
};

export const deletePazysalvo = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete: marcar como "Anulado" en lugar de eliminar físicamente
        const [result] = await pool.query("UPDATE PazSalvos SET estado = 'Anulado' WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Paz y salvo no encontrado" });
        return res.json({ message: "Paz y salvo anulado correctamente", id });
    } catch (error) {
        console.error("deletePazysalvo:", error);
        return res.status(500).json({ message: "Error al anular paz y salvo", error: error.message });
    }
};

// ==================== ESTADÍSTICAS ====================

// Total de paz y salvos generados
export const getTotalPazSalvos = async (req, res) => {

    try {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM PazSalvos WHERE eliminado = FALSE"
        );
        return res.json({
            total: rows[0]?.total || 0,
            label: "Paz y Salvos Generados"
        });
    } catch (error) {
        console.error("getTotalPazSalvos:", error);
        return res.status(500).json({ message: "Error obteniendo total de paz y salvos", error: error.message });
    }
};

// Estadísticas consolidadas de paz y salvos (en proceso y completados)
export const getPazSalvosStats = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT estado, COUNT(*) as total FROM PazSalvos WHERE estado IN ('En Proceso', 'Completado') AND eliminado = FALSE GROUP BY estado"
        );
    
        const stats = {
            enProceso: 0,
            completados: 0
        };
    
        rows.forEach(row => {
            if (row.estado === 'En Proceso') stats.enProceso = row.total;
            if (row.estado === 'Completado') stats.completados = row.total;
        });
    
        return res.json(stats);
    } catch (error) {
        console.error("getPazSalvosStats:", error);
        return res.status(500).json({ message: "Error obteniendo estadísticas de paz y salvos", error: error.message });
    }
};
