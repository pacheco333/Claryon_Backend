import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firmasDir = path.join(__dirname, '../uploads/firmas');
if (!fs.existsSync(firmasDir)) {
  fs.mkdirSync(firmasDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const idUsuario = String(req.params?.id || req.body?.id || req.user?.id || '').trim();

    if (!idUsuario) {
      return cb(new Error('No se pudo determinar el id del usuario para guardar la firma'));
    }

    const userDir = path.join(firmasDir, idUsuario);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `firma-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const uploadFirma = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadFirma;
