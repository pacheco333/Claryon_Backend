import { Router } from "express";
import * as PermisosCtrl from "../controllers/permisos.controller.js";
import { 
    validatorPermisos, 
    validatorUserId, 
    validatorPermisosSingle 
} from "../validators/permisos.validator.js";
import { verificarToken } from "../middlewares/verificarToken.js";

const router = Router();

router.use(verificarToken);


// GET permisos de un usuario específico
router.get("/:id", validatorUserId, PermisosCtrl.getPermisosByUsuario);

// POST - Crear o asignar permisos a un usuario
router.post("/:id", validatorUserId, validatorPermisos, PermisosCtrl.crearPermisos);

// DELETE - Remover un permiso individual de un usuario
router.delete("/:id/remover/:permiso", validatorUserId, PermisosCtrl.removerPermiso);

export default router;
