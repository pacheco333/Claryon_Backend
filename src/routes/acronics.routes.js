import express from "express";
import * as AcronicsCtrl from "../controllers/acronics.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { validarAcronics } from "../middlewares/validarAcronics.js";
import { upload as multerAcronics } from "../config/multerAcronics.js";
import {
	createAcronicsValidator,
	updateAcronicsValidator,
	idAcronicsValidator
} from "../validators/acronics.validator.js";

const router = express.Router();

router.use(verificarToken);

router.get("/", AcronicsCtrl.getAcronics);
router.get("/:id", idAcronicsValidator, AcronicsCtrl.getAcronicsById);

router.post(
	"/",
	multerAcronics.fields([{ name: "fotografia_1", maxCount: 1 }, { name: "fotografia_2", maxCount: 1 }]),
	createAcronicsValidator,
	validarAcronics,
	AcronicsCtrl.createAcronics
);

router.put("/:id", updateAcronicsValidator, AcronicsCtrl.updateAcronics);
router.delete("/:id", idAcronicsValidator, AcronicsCtrl.deleteAcronics);
export default router;
