import { pool } from "../config/db.js";
import { ETAPAS_CONFIG } from "../utils/etapasConfig.js";
// Construye dinámicamente las partes de la consulta para asignados y completados
const buildAssignedSelect = () => ETAPAS_CONFIG
	.map(cfg => `IF(ps.${cfg.responsableColumn} = ?, 1, 0) AS asignado_${cfg.key}`)
	.join(',\n\t\t\t\t');
// Para cada etapa, verifica si el usuario es responsable (asignado) y si la etapa está completada según su lógica específica.
const buildCompletedSelect = () => ETAPAS_CONFIG
	.map(cfg => `IF(EXISTS(${cfg.completadoSubquery}), 1, 0) AS completado_${cfg.key}`)
	.join(',\n\t\t\t\t');
// Construye la parte de la cláusula WHERE para verificar si el usuario es responsable en alguna etapa
const buildWhereResponsable = () => ETAPAS_CONFIG
	.map(cfg => `ps.${cfg.responsableColumn} = ?`)
	.join(' OR\n\t\t\t\t ');

// Obtiene los paz y salvos asignados al usuario logueado con sus etapas
export const getMisProcesos = async (req, res) => {
	try {
		const userId = req?.user?.id;

		if (!userId) {
			return res.status(401).json({ message: "Usuario no autenticado" });
		}
// La consulta se construye dinámicamente para incluir todas las etapas definidas en ETAPAS_CONFIG
		const query = `SELECT 
				ps.id,
				ps.id_empleado,
				ps.estado,
				TRIM(CONCAT(IFNULL(e.nombres,''), ' ', IFNULL(e.apellidos,''))) AS empleado_nombre,

				${buildAssignedSelect()},
				${buildCompletedSelect()}

			 FROM PazSalvos ps
			 LEFT JOIN Empleados e ON ps.id_empleado = e.id
			 WHERE ps.estado != 'Anulado'
			   AND ps.eliminado = FALSE
			   AND (
				 ${buildWhereResponsable()}
			   )
			 ORDER BY ps.fecha_creacion DESC`;
// Los parámetros se repiten para cada etapa: primero para verificar asignados y luego para verificar completados
		const params = [
			...Array(ETAPAS_CONFIG.length).fill(userId),
			...Array(ETAPAS_CONFIG.length).fill(userId),
		];

		const [rows] = await pool.query(query, params);

		const results = rows.map(row => {
			const etapas = ETAPAS_CONFIG
				.filter(cfg => row[`asignado_${cfg.key}`])
				.map(cfg => ({
					nombre: cfg.nombre,
					completada: !!row[`completado_${cfg.key}`],
					ruta: cfg.ruta
				}));

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
