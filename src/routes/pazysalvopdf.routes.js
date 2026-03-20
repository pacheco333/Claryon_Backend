import express from "express";
import { descargarPazysalvoPdf } from "../controllers/pazysalvoPdf.controller.js";
import { validateIdParam, handleValidationResult } from "../validators/common.validator.js";
import { verificarToken } from "../middlewares/verificarToken.js";

const router = express.Router();

router.use(verificarToken);

router.get("/:id", validateIdParam, handleValidationResult, descargarPazysalvoPdf);

export default router;
