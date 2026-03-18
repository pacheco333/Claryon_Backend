import { Router } from "express";
import {
    getUsuariosPaginated,
//    getUsuariosFiltered,
    postUsuarios,
    getUsuarioPorId,
    putUsuario,
    deleteUsuario
} from "../controllers/usuarios.controller.js";
import { verificarToken } from "../middlewares/verificarToken.js";
import {
    validatorCreateUser,
    validatorUpdateUser,
    validatorQueryUsers,
} from "../validators/usuarios.validator.js";
import {
    validateIdParam,
} from "../validators/common.validator.js";
import uploadFirma from "../config/multerFirma.js";


const router = Router();

// NOTA: este archivo se monta en /api/usuarios => usar rutas relativas aquí

// /api/usuarios  -> filtros / paginación opcional
//router.get("/", verificarToken, validatorQueryUsers, getUsuariosFiltered);

// /api/usuarios/paginated -> páginas fijas de 10
router.get("/paginated", verificarToken, validatorQueryUsers, getUsuariosPaginated);

// Crear /api/usuarios
router.post("/", validatorCreateUser, postUsuarios);

// Operaciones por id: /api/usuarios/:id
router.get("/:id",  verificarToken, validateIdParam, getUsuarioPorId);
router.put("/:id", verificarToken, validateIdParam, uploadFirma.single("firma"), validatorUpdateUser, putUsuario);
router.delete("/:id", verificarToken, validateIdParam, deleteUsuario);

export default router;