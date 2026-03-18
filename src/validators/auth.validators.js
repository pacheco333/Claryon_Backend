import { check } from "express-validator";
import validateResult from "../utils/handleValidators.js";

export const validatorLoginUser = [
    check("correo").exists().isEmail().withMessage("correo inválido"),
    check("contrasena").exists().notEmpty().withMessage("contrasena es obligatoria"),
    (req, res, next) => validateResult(req, res, next)
];