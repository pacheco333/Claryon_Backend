import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Almacenamiento dinámico según el empleado del paz y salvo
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const idPazSalvo = req.body?.id_paz_salvo;
            let empleadoId = 'unknown';

            if (idPazSalvo) {
                const [pazSalvo] = await pool.query(
                    "SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
                    [idPazSalvo]
                );
                if (pazSalvo && pazSalvo.length > 0) {
                    empleadoId = pazSalvo[0].id_empleado;
                }
            }

            const uploadsDir = path.join(__dirname, `../uploads/empleados/${empleadoId}/plataformas`);

            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            cb(null, uploadsDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const tipo = file.fieldname === 'fotografia_buzon' ? 'buzon' : 'onedrive';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `plataforma-${tipo}-${timestamp}${ext}`);
    }
});

// Filtro: solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan: JPEG, PNG, GIF, WebP`), false);
    }
};

const uploadPlataformas = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

export const upload = uploadPlataformas;
