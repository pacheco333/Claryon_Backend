import express from "express";
import * as PazysalvoCtrl from "../controllers/pazysalvo.controller.js";
import { createPazysalvoValidator, updatePazysalvoValidator, idPazysalvoValidator } from "../validators/pazysalvo.validator.js";
import { validateIdParam } from "../validators/common.validator.js";
import { verificarToken } from "../middlewares/verificarToken.js";

const router = express.Router();

router.use(verificarToken);

// Stats and totals
router.get("/stats", PazysalvoCtrl.getPazSalvosStats);
router.get("/total", PazysalvoCtrl.getTotalPazSalvos);

// CRUD endpoints
router.get("/",PazysalvoCtrl.getPazysalvosPaginated);
router.get("/:id", validateIdParam, idPazysalvoValidator, PazysalvoCtrl.getPazysalvoById);

router.post("/",createPazysalvoValidator, PazysalvoCtrl.createPazysalvo);
router.put("/:id", validateIdParam, updatePazysalvoValidator, PazysalvoCtrl.updatePazysalvo);
router.delete("/:id", validateIdParam, idPazysalvoValidator, PazysalvoCtrl.deletePazysalvo);

export default router;
