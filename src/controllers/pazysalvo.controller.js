import { pool } from "../config/db.js";

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
        const offset = (page - 1) * limit;

        const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM PazSalvos WHERE estado != 'Anulado'");
        const total = countRows[0]?.total || 0;
       
        const [rows] = await pool.query(
            `SELECT ps.*,
                    e.nombres, e.apellidos, e.correo, e.puesto, e.compania, e.area,
                    TRIM(CONCAT(IFNULL(u.nombres,''), ' ', IFNULL(u.apellidos,''))) AS creado_por_nombre,
                    (
                        IF(EXISTS(SELECT 1 FROM Dispositivos d WHERE d.id_paz_salvo = ps.id AND d.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Plataformas p WHERE p.id_paz_salvo = ps.id AND p.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Lineas l WHERE l.id_paz_salvo = ps.id AND l.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_antivirus IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_copia_seguridad IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_erp IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_otras_licencias IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Glpi g WHERE g.id_paz_salvo = ps.id AND g.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Acronics a WHERE a.id_paz_salvo = ps.id AND a.eliminado = FALSE), 1, 0)
                    ) AS etapas_completadas,
                    9 AS total_etapas
             FROM PazSalvos ps
             LEFT JOIN Empleados e ON ps.id_empleado = e.id
             LEFT JOIN Usuarios u ON ps.id_creado_por = u.id
             WHERE ps.estado != 'Anulado'
             ORDER BY ps.fecha_creacion DESC LIMIT ? OFFSET ?`,
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
            `SELECT ps.*,
                    e.nombres, e.apellidos, e.correo, e.puesto, e.compania, e.area,
                    TRIM(CONCAT(IFNULL(u.nombres,''), ' ', IFNULL(u.apellidos,''))) AS creado_por_nombre,
                    (
                        IF(EXISTS(SELECT 1 FROM Dispositivos d WHERE d.id_paz_salvo = ps.id AND d.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Plataformas p WHERE p.id_paz_salvo = ps.id AND p.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Lineas l WHERE l.id_paz_salvo = ps.id AND l.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_antivirus IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_copia_seguridad IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_erp IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_otras_licencias IS NOT NULL), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Glpi g WHERE g.id_paz_salvo = ps.id AND g.eliminado = FALSE), 1, 0)
                        + IF(EXISTS(SELECT 1 FROM Acronics a WHERE a.id_paz_salvo = ps.id AND a.eliminado = FALSE), 1, 0)
                    ) AS etapas_completadas,
                    9 AS total_etapas
             FROM PazSalvos ps
             LEFT JOIN Empleados e ON ps.id_empleado = e.id
             LEFT JOIN Usuarios u ON ps.id_creado_por = u.id
             WHERE ps.id = ? AND ps.estado != 'Anulado'`,
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

// ==================== MIS PROCESOS ====================
// Obtiene los paz y salvos asignados al usuario logueado con sus etapas
export const getMisProcesos = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.query(
            `SELECT 
                ps.id,
                ps.id_empleado,
                ps.estado,
                TRIM(CONCAT(IFNULL(e.nombres,''), ' ', IFNULL(e.apellidos,''))) AS empleado_nombre,

                IF(ps.id_resp_equipos = ?, 1, 0) AS asignado_equipos,
                IF(ps.id_resp_plataformas = ?, 1, 0) AS asignado_plataformas,
                IF(ps.id_resp_linea = ?, 1, 0) AS asignado_linea,
                IF(ps.id_resp_antivirus = ?, 1, 0) AS asignado_antivirus,
                IF(ps.id_resp_idrive = ?, 1, 0) AS asignado_idrive,
                IF(ps.id_resp_sap = ?, 1, 0) AS asignado_sap,
                IF(ps.id_resp_otras_lic = ?, 1, 0) AS asignado_otras_lic,
                IF(ps.id_resp_glpi = ?, 1, 0) AS asignado_glpi,
                IF(ps.id_resp_acronics = ?, 1, 0) AS asignado_acronics,

                IF(EXISTS(SELECT 1 FROM Dispositivos d WHERE d.id_paz_salvo = ps.id AND d.eliminado = FALSE), 1, 0) AS completado_equipos,
                IF(EXISTS(SELECT 1 FROM Plataformas p WHERE p.id_paz_salvo = ps.id AND p.eliminado = FALSE), 1, 0) AS completado_plataformas,
                IF(EXISTS(SELECT 1 FROM Lineas l WHERE l.id_paz_salvo = ps.id AND l.eliminado = FALSE), 1, 0) AS completado_linea,
                IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_antivirus IS NOT NULL), 1, 0) AS completado_antivirus,
                IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_copia_seguridad IS NOT NULL), 1, 0) AS completado_idrive,
                IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_erp IS NOT NULL), 1, 0) AS completado_sap,
                IF(EXISTS(SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_otras_licencias IS NOT NULL), 1, 0) AS completado_otras_lic,
                IF(EXISTS(SELECT 1 FROM Glpi g WHERE g.id_paz_salvo = ps.id AND g.eliminado = FALSE), 1, 0) AS completado_glpi,
                IF(EXISTS(SELECT 1 FROM Acronics a WHERE a.id_paz_salvo = ps.id AND a.eliminado = FALSE), 1, 0) AS completado_acronics

             FROM PazSalvos ps
             LEFT JOIN Empleados e ON ps.id_empleado = e.id
             WHERE ps.estado != 'Anulado'
               AND ps.eliminado = FALSE
               AND (
                 ps.id_resp_equipos = ? OR
                 ps.id_resp_plataformas = ? OR
                 ps.id_resp_linea = ? OR
                 ps.id_resp_antivirus = ? OR
                 ps.id_resp_idrive = ? OR
                 ps.id_resp_sap = ? OR
                 ps.id_resp_otras_lic = ? OR
                 ps.id_resp_glpi = ? OR
                 ps.id_resp_acronics = ?
               )
             ORDER BY ps.fecha_creacion DESC`,
            [
                userId, userId, userId, userId, userId, userId, userId, userId, userId,
                userId, userId, userId, userId, userId, userId, userId, userId, userId
            ]
        );

        const ETAPAS_CONFIG = [
            { key: 'equipos', nombre: 'Equipos', ruta: 'etapa-equipos' },
            { key: 'plataformas', nombre: 'Plataformas', ruta: 'etapa-plataformas' },
            { key: 'linea', nombre: 'Línea Telefónica', ruta: 'etapa-linea' },
            { key: 'antivirus', nombre: 'Antivirus', ruta: 'etapa-antivirus' },
            { key: 'idrive', nombre: 'iDrive', ruta: 'etapa-idrive' },
            { key: 'sap', nombre: 'SAP', ruta: 'etapa-sap' },
            { key: 'otras_lic', nombre: 'Otras Licencias', ruta: 'etapa-otras-licencias' },
            { key: 'glpi', nombre: 'GLPI', ruta: 'etapa-glpi' },
            { key: 'acronics', nombre: 'Acronics', ruta: 'etapa-acronics' },
        ];

        const results = rows.map(row => {
            const etapas = [];
            for (const cfg of ETAPAS_CONFIG) {
                if (row[`asignado_${cfg.key}`]) {
                    etapas.push({
                        nombre: cfg.nombre,
                        completada: !!row[`completado_${cfg.key}`],
                        ruta: cfg.ruta
                    });
                }
            }
            return {
                id: row.id,
                id_empleado: row.id_empleado,
                empleado_nombre: row.empleado_nombre,
                estado: row.estado,
                etapas
            };
        });

        return res.json(results);
    } catch (error) {
        console.error("getMisProcesos:", error);
        return res.status(500).json({ message: "Error al obtener mis procesos", error: error.message });
    }
};
