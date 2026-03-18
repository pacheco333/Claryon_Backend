import { check, param } from "express-validator";
import validateResult from "../utils/handleValidators.js";

const PERMISOS_DISPONIBLES = [
    "Administrador",
    "Equipos",
    "Lineas",
    "Antivirus",
    "Correo",
    "Idrive",
    "SAP"
];

export const validatorPermisos = [
    check("permisos")
        .isArray({ min: 1 })
        .withMessage("permisos debe ser un array con al menos un elemento"),
    check("permisos.*")
        .isIn(PERMISOS_DISPONIBLES)
        .withMessage(`Cada permiso debe estar en: ${PERMISOS_DISPONIBLES.join(", ")}`),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorUserId = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("id debe ser un número entero positivo"),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorPermisosSingle = [
    check("permiso")
        .isIn(PERMISOS_DISPONIBLES)
        .withMessage(`permiso debe estar en: ${PERMISOS_DISPONIBLES.join(", ")}`),
    (req, res, next) => validateResult(req, res, next)
];
