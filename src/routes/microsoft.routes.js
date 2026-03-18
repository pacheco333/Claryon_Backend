import express from "express";
import * as MicrosoftCtrl from "../controllers/microsoft.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import { upload as multerPlataformas } from "../config/multerPlataformas.js";

const router = express.Router();

router.use(verificarToken);

router.get("/", MicrosoftCtrl.getMicrosoft);
router.get("/:id", MicrosoftCtrl.getMicrosoftById);
router.post(
    "/",
    multerPlataformas.fields([
        { name: 'fotografia_onedrive', maxCount: 1 },
        { name: 'fotografia_buzon', maxCount: 1 }
    ]),
    MicrosoftCtrl.createMicrosoft
);
router.put("/:id", MicrosoftCtrl.updateMicrosoft);
router.delete("/:id", MicrosoftCtrl.deleteMicrosoft);

export default router;