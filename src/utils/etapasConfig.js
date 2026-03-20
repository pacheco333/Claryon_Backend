export const ETAPAS_CONFIG = [
    // Cada objeto representa una etapa del proceso de paz y salvo, con su lógica específica para determinar asignados y completados
	{
		key: 'equipos',
		nombre: 'Equipos',
		ruta: 'etapa-equipos',
		responsableColumn: 'id_resp_equipos',
		completadoSubquery: 'SELECT 1 FROM Dispositivos d WHERE d.id_paz_salvo = ps.id AND d.eliminado = FALSE'
	},
	{
		key: 'plataformas',
		nombre: 'Plataformas',
		ruta: 'etapa-plataformas',
		responsableColumn: 'id_resp_plataformas',
		completadoSubquery: 'SELECT 1 FROM Plataformas p WHERE p.id_paz_salvo = ps.id AND p.eliminado = FALSE'
	},
	{
		key: 'linea',
		nombre: 'Línea Telefónica',
		ruta: 'etapa-linea',
		responsableColumn: 'id_resp_linea',
		completadoSubquery: 'SELECT 1 FROM Lineas l WHERE l.id_paz_salvo = ps.id AND l.eliminado = FALSE'
	},
	{
		key: 'antivirus',
		nombre: 'Antivirus',
		ruta: 'etapa-antivirus',
		responsableColumn: 'id_resp_antivirus',
		completadoSubquery: 'SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_antivirus IS NOT NULL'
	},
	{
		key: 'idrive',
		nombre: 'iDrive',
		ruta: 'etapa-idrive',
		responsableColumn: 'id_resp_idrive',
		completadoSubquery: 'SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_copia_seguridad IS NOT NULL'
	},
	{
		key: 'sap',
		nombre: 'SAP',
		ruta: 'etapa-sap',
		responsableColumn: 'id_resp_sap',
		completadoSubquery: 'SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_erp IS NOT NULL'
	},
	{
		key: 'otras_lic',
		nombre: 'Otras Licencias',
		ruta: 'etapa-otras-licencias',
		responsableColumn: 'id_resp_otras_lic',
		completadoSubquery: 'SELECT 1 FROM Licencias lic WHERE lic.id_paz_salvo = ps.id AND lic.eliminado = FALSE AND lic.responsable_otras_licencias IS NOT NULL'
	},
	{
		key: 'glpi',
		nombre: 'GLPI',
		ruta: 'etapa-glpi',
		responsableColumn: 'id_resp_glpi',
		completadoSubquery: 'SELECT 1 FROM Glpi g WHERE g.id_paz_salvo = ps.id AND g.eliminado = FALSE'
	},
	{
		key: 'acronics',
		nombre: 'Acronics',
		ruta: 'etapa-acronics',
		responsableColumn: 'id_resp_acronics',
		completadoSubquery: 'SELECT 1 FROM Acronics a WHERE a.id_paz_salvo = ps.id AND a.eliminado = FALSE'
	},
];
