import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            let empleadoId = 'unknown';

            // POST → id_paz_salvo viene en el body
            // PUT  → se obtiene a través del id de la licencia en la URL
            const idPazSalvo = req.body?.id_paz_salvo;
            const licenciaId = req.params?.id;

            if (idPazSalvo) {
                const [rows] = await pool.query(
                    'SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE',
                    [idPazSalvo]
                );
                if (rows && rows.length > 0) {
                    empleadoId = rows[0].id_empleado;
                }
            } else if (licenciaId) {
                const [rows] = await pool.query(
                    `SELECT ps.id_empleado
                     FROM Licencias l
                     JOIN PazSalvos ps ON l.id_paz_salvo = ps.id
                     WHERE l.id = ? AND l.eliminado = FALSE`,
                    [licenciaId]
                );
                if (rows && rows.length > 0) {
                    empleadoId = rows[0].id_empleado;
                }
            }

            const uploadsDir = path.join(__dirname, `../uploads/empleados/${empleadoId}/licencias`);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            cb(null, uploadsDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const fieldMap = {
            fotografia_antivirus:        'antivirus',
            fotografia_copia_seguridad:  'idrive',
            fotografia_erp:              'sap',
            fotografia_otras_licencias:  'otras',
        };
        const tipo = fieldMap[file.fieldname] || file.fieldname;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `licencia-${tipo}-${timestamp}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan: JPEG, PNG, GIF, WebP`),
            false
        );
    }
};

const uploadLicencias = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const upload = uploadLicencias;
