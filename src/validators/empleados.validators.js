import { check, query } from "express-validator";
import validateResult from "../utils/handleValidators.js";

const COMPANIAS_PERMITIDAS = [
    'INDUSTRIA AMBIENTAL S.A.S',
    'LOGISTICA Y DISTRIBUCION ESPECIALIZADA L&D S.A.S',
    'ECOLOGIA Y ENTORNO S.A.S. E.S.P.',
    'LUBRYESP S.A.S',
    'VALREX S.A.S',
    'ENERGIA PURA PROYECTO SOPO S.A.S.',
    'ASESORÍAS SERVICIOS ECOLÓGICOS E INDUSTRIALES S.A.S',
    'BIOLÓGICOS Y CONTAMINADOS S.A.S ESP',
    'VALREX GUATEMALA',
    'VALREX SRL REPUBLICA DOMINICANA',
    'VALREX S.A.C PERÚ',
    'IA4 S.A.S',
    'ECOLOGISTICA S.A.S E.S.P'
];

export const validatorCreateEmpleado = [
    check("id").exists().notEmpty().withMessage("Numero de Documento obligatorio"),
    check("nombres").exists().notEmpty().withMessage("nombres es obligatorio"),
    check("apellidos").exists().notEmpty().withMessage("apellidos es obligatorio"),
    check("correo").exists().isEmail().withMessage("correo inválido"),
    check("puesto").optional().isString().trim().withMessage("puesto inválido"),
    check("compania").exists().isString().isIn(COMPANIAS_PERMITIDAS).withMessage(`compania debe ser una de: ${COMPANIAS_PERMITIDAS.join(", ")}`),
    check("area").optional().isString().withMessage("area inválida"),
    check("fecha_ingreso").optional().isISO8601().withMessage("fecha_ingreso debe tener formato ISO (YYYY-MM-DD)"),
    check("fecha_retiro").optional().isISO8601().withMessage("fecha_retiro debe tener formato ISO (YYYY-MM-DD)"),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorUpdateEmpleado = [
    check("nombres").optional().notEmpty().withMessage("nombres no puede estar vacío"),
    check("apellidos").optional().notEmpty().withMessage("apellidos no puede estar vacío"),
    check("correo").optional().isEmail().withMessage("correo inválido"),
    check("contrasena").optional().isLength({ min: 7, max: 50 }).withMessage("contraseña entre 7 y 50"),
    check("puesto").optional().isString().trim().withMessage("puesto inválido"),
    check("compania").optional().isString().isIn(COMPANIAS_PERMITIDAS).withMessage(`compania debe ser una de: ${COMPANIAS_PERMITIDAS.join(", ")}`),
    check("area").optional().isString().withMessage("area inválida"),
    check("fecha_ingreso").optional().isISO8601().withMessage("fecha_ingreso debe tener formato ISO (YYYY-MM-DD)"),
    check("fecha_retiro").optional().isISO8601().withMessage("fecha_retiro debe tener formato ISO (YYYY-MM-DD)"),
    (req, res, next) => validateResult(req, res, next)
];

export const validatorQueryEmpleados = [
    query("page").optional().isInt({ min: 1 }).toInt().withMessage("page debe ser entero >= 1"),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt().withMessage("limit debe ser entero entre 1 y 100"),
    query("search").optional().isString().trim(),
    (req, res, next) => validateResult(req, res, next)
];