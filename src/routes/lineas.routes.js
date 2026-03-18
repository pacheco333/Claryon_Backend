import express from "express";
import * as LineasCtrl from "../controllers/lineas.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { validarLineas } from "../middlewares/validarLineas.js";
import {
  createLineaValidator,
  updateLineaValidator,
  idLineaValidator,
} from "../validators/lineas.validator.js";

const router = express.Router();

router.use(verificarToken);

router.get("/", LineasCtrl.getLineas);
router.get("/paz-salvo/:id_paz_salvo", LineasCtrl.getLineaByPazSalvo);
router.get("/:id", idLineaValidator, LineasCtrl.getLineaById);
router.post("/", createLineaValidator, validarLineas, LineasCtrl.createLinea);
router.put("/:id", updateLineaValidator, LineasCtrl.updateLinea);
router.delete("/:id", idLineaValidator, LineasCtrl.deleteLinea);

export default router;
