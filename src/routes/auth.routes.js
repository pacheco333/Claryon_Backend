import { Router } from "express";
import { login, validateToken, logout } from "../controllers/auth.controller.js";
import { validatorLoginUser } from "../validators/auth.validators.js";
import { verificarToken } from "../middlewares/verificarToken.js";

const router = Router();

// Queda montado automáticamente en /api/auth/login
router.post("/login", validatorLoginUser, login);

// Endpoint para validar token y tiempo de expiración
router.post("/check-token", validateToken);

// Endpoint para cerrar sesión
router.post("/logout", verificarToken, logout);

export default router;