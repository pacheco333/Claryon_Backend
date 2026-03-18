import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool } from './db.js';

// Obtener __dirname en módulos ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para crear el directorio dinámicamente según el empleado del paz y salvo
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const idPazSalvo = req.body?.id_paz_salvo;
            let empleadoId = 'unknown';

            // Si existe id_paz_salvo, obtener el id_empleado asociado
            if (idPazSalvo) {
                const [pazSalvo] = await pool.query(
                    "SELECT id_empleado FROM PazSalvos WHERE id = ? AND eliminado = FALSE",
                    [idPazSalvo]
                );
                if (pazSalvo && pazSalvo.length > 0) {
                    empleadoId = pazSalvo[0].id_empleado;
                }
            }

            const uploadsDir = path.join(__dirname, `../uploads/empleados/${empleadoId}/acronics`);

            // Crear directorio si no existe
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            cb(null, uploadsDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Formato: acronics-{id}-foto{numero}-{timestamp}.ext
        const acronicsId = req.params.id || 'temp';
        const fieldName = file.fieldname; // 'fotografia_1' o 'fotografia_2'
        const fotoNum = fieldName === 'fotografia_2' ? '2' : '1';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);

        cb(null, `acronics-${acronicsId}-foto${fotoNum}-${timestamp}${ext}`);
    }
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
};

// Configurar multer para Acronics
const uploadAcronics = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

export const upload = uploadAcronics;
