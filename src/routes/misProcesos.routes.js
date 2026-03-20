import express from "express";
import { verificarToken } from "../middlewares/verificarToken.js";
import * as MisProcesosCtrl from "../controllers/misProcesos.controller.js";

const router = express.Router();

router.use(verificarToken);

// GET /api/misProcesos/mis-procesos
router.get("/mis-procesos", MisProcesosCtrl.getMisProcesos);

export default router;
