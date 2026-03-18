import express from "express";
import * as GlpiCtrl from "../controllers/glpi.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { validarGlpi } from "../middlewares/validarGlpi.js";
import { upload as multerGlpi } from "../config/multerGlpi.js";
import {
	createGlpiValidator,
	updateGlpiValidator,
	idGlpiValidator
} from "../validators/glpi.validators.js";

const router = express.Router();

router.use(verificarToken);

router.get("/", GlpiCtrl.getGlpi);
router.get("/:id", idGlpiValidator, GlpiCtrl.getGlpiById);

router.post(
	"/",
	multerGlpi.fields([{ name: "fotografia_1", maxCount: 1 }, { name: "fotografia_2", maxCount: 1 }]),
	createGlpiValidator,
	validarGlpi,
	GlpiCtrl.createGlpi
);

router.put("/:id", updateGlpiValidator, GlpiCtrl.updateGlpi);
router.delete("/:id", idGlpiValidator, GlpiCtrl.deleteGlpi);

export default router;
