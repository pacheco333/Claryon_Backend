import express from "express";
import * as DispositivosCtrl from "../controllers/dispositivos.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { validarDispositivo } from "../middlewares/validarDispositivo.js";
import { upload as multerDispositivos } from "../config/multerDispositivos.js";

const router = express.Router();

router.use(verificarToken);

// Rutas GET (listar y obtener por ID)
router.get("/", DispositivosCtrl.getDispositivos);
router.get("/:id", DispositivosCtrl.getDispositivoById);

// Ruta para crear dispositivo con dos fotografías
// multer PRIMERO (procesa multipart/form-data), luego validar, luego controlador
router.post(
    "/", 
    multerDispositivos.fields([{ name: 'fotografia_1', maxCount: 1 }, { name: 'fotografia_2', maxCount: 1 }]),
    validarDispositivo,
    DispositivosCtrl.createDispositivo
);

router.put("/:id", DispositivosCtrl.updateDispositivo);

// Ruta DELETE (debe ir al final para evitar conflictos de rutas)
router.delete("/:id", DispositivosCtrl.deleteDispositivo);

export default router;