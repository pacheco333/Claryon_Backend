import express from "express";
import * as PazysalvoPdfCtrl from "../controllers/pazysalvoPdf.controller.js";
import { idPazysalvoValidator } from "../validators/pazysalvo.validator.js"; // usa tu validador existente

const router = express.Router();
// Ruta independiente: monta este router, por ejemplo, en /pazysalvo-pdf
router.get("/:id", idPazysalvoValidator, PazysalvoPdfCtrl.generatePazysalvoPdf);

export default router;