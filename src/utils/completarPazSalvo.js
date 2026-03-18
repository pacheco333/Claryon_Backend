import { pool } from "../config/db.js";

/**
 * Verifica si todas las etapas de un Paz y Salvo están completas y,
 * en caso afirmativo, actualiza el estado a 'Completado'.
 *
 * Etapas requeridas:
 *  1. Entrega de Equipos   → al menos un registro en Dispositivos
 *  2. Plataformas Digitales → al menos un registro en Plataformas
 *  3. Línea Telefónica     → al menos un registro en Lineas
 *  4. Antivirus            → Licencias.responsable_antivirus IS NOT NULL
 *  5. iDrive               → Licencias.responsable_copia_seguridad IS NOT NULL
 *  6. Sistema SAP          → Licencias.responsable_erp IS NOT NULL
 *  7. Otras Licencias      → Licencias.responsable_otras_licencias IS NOT NULL
 *  8. GLPI                 → al menos un registro en Glpi
 *  9. Acronics             → al menos un registro en Acronics
 *
 * @param {number} idPazSalvo
 */
export const verificarYCompletarPazSalvo = async (idPazSalvo) => {
    if (!idPazSalvo) return;

    try {
        const [[check]] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM Dispositivos  WHERE id_paz_salvo = ? AND eliminado = FALSE) > 0   AS tiene_dispositivos,
                (SELECT COUNT(*) FROM Plataformas   WHERE id_paz_salvo = ? AND eliminado = FALSE) > 0   AS tiene_plataformas,
                (SELECT COUNT(*) FROM Lineas        WHERE id_paz_salvo = ? AND eliminado = FALSE) > 0   AS tiene_lineas,
                (SELECT COUNT(*) FROM Licencias
                    WHERE id_paz_salvo = ? AND eliminado = FALSE
                      AND responsable_antivirus       IS NOT NULL
                      AND responsable_copia_seguridad IS NOT NULL
                      AND responsable_erp             IS NOT NULL
                      AND responsable_otras_licencias IS NOT NULL
                ) > 0 AS tiene_licencias_completas,
                (SELECT COUNT(*) FROM Glpi     WHERE id_paz_salvo = ? AND eliminado = FALSE) > 0   AS tiene_glpi,
                (SELECT COUNT(*) FROM Acronics WHERE id_paz_salvo = ? AND eliminado = FALSE) > 0   AS tiene_acronics`,

            [idPazSalvo, idPazSalvo, idPazSalvo, idPazSalvo, idPazSalvo, idPazSalvo]
        );

        const todasCompletas =
            check.tiene_dispositivos &&
            check.tiene_plataformas &&
            check.tiene_lineas &&
            check.tiene_licencias_completas &&
            check.tiene_glpi &&
            check.tiene_acronics;
            

        if (todasCompletas) {
            await pool.query(
                "UPDATE PazSalvos SET estado = 'Completado', fecha_fin = CURDATE() WHERE id = ? AND estado != 'Anulado'",
                [idPazSalvo]
            );
            console.log(`PazSalvo ${idPazSalvo} marcado como Completado.`);
        }
    } catch (error) {
        // No interrumpir la respuesta principal si esto falla
        console.error(`verificarYCompletarPazSalvo(${idPazSalvo}):`, error);
    }
};
