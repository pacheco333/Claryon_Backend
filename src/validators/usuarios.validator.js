import { check, param, query } from "express-validator";
import validateResult from "../utils/handleValidators.js";

const ROL = [
    "Administrador",
    "Usuario",
    "Invitado"
];

export const validatorCreateUser = [
    check("id").exists().notEmpty().withMessage("Numero de Documento obligatorio"),
    check("nombres").exists().notEmpty().withMessage("nombres es obligatorio"),
    check("apellidos").exists().notEmpty().withMessage("apellidos es obligatorio"),
    check("correo").exists().isEmail().withMessage("correo inválido"),
    check("contrasena")
        .exists()
        .isLength({ min: 7, max: 50 })
        .withMessage("contrasena entre 7 y 50 caracteres"),
    check("rol")
            .isIn(ROL)
            .optional()
            .withMessage(`Cada rol debe estar en: ${ROL.join(", ")}`),
    check("activo").optional().isBoolean().withMessage("activo debe ser booleano"),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorUpdateUser = [
    check("nombres").optional().notEmpty().withMessage("nombres no puede estar vacío"),
    check("apellidos").optional().notEmpty().withMessage("apellidos no puede estar vacío"),
    check("correo").optional().isEmail().withMessage("correo inválido"),
    check("contrasena").optional().isLength({ min: 7, max: 50 }).withMessage("contrasena entre 7 y 50 caracteres"),
    check("telefono").optional().isMobilePhone("any").withMessage("telefono inválido"),
    check("rol").optional().isIn(ROL).withMessage(`Cada rol debe estar en: ${ROL.join(", ")}`),
    check("activo").optional().isBoolean().withMessage("activo debe ser booleano"),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorQueryUsers = [
    query("page").optional().isInt({ min: 1 }).toInt().withMessage("page debe ser entero >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt().withMessage("limit debe ser entero entre 1 y 100"),
    query("search").optional().isString().trim(),
    (req, res, next) => validateResult(req, res, next)
];