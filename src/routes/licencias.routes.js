import express from "express";
import * as LicenciasCtrl from "../controllers/licencias.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { upload as multerLicencias } from "../config/multerLicencias.js";

const router = express.Router();

router.use(verificarToken);

// Campos de imagen aceptados en POST y PUT
const fotoFields = [
    { name: 'fotografia_antivirus',       maxCount: 1 },
    { name: 'fotografia_copia_seguridad', maxCount: 1 },
    { name: 'fotografia_erp',             maxCount: 1 },
    { name: 'fotografia_otras_licencias', maxCount: 1 },
];

router.get("/",    LicenciasCtrl.getLicencias);
router.get("/:id", LicenciasCtrl.getLicenciaById);

// multer procesa multipart/form-data antes que el controlador
router.post("/upsert", multerLicencias.fields(fotoFields), LicenciasCtrl.upsertLicencia);
// router.put("/:id",     multerLicencias.fields(fotoFields), LicenciasCtrl.updateLicencia);
router.delete("/:id", LicenciasCtrl.deleteLicencia);

export default router;