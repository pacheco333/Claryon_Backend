import { check } from "express-validator";
import { validateIdParam, handleValidationResult } from "./common.validator.js";

export const createPazysalvoValidator = [
  check("id_empleado")
    .exists().withMessage("id_empleado es requerido")
    .bail()
    .isInt({ gt: 0 }).withMessage("id_empleado debe ser un entero"),
  check("fecha_inicio")
    .exists().withMessage("fecha_inicio es requerida")
    .bail()
    .isISO8601().withMessage("fecha_inicio debe tener formato ISO (YYYY-MM-DD)"),
  check("observaciones")
    .optional()
    .isString().isLength({ max: 255 }).withMessage("observaciones inválidas"),
  handleValidationResult
];

export const updatePazysalvoValidator = [
  validateIdParam,
  check("id_empleado")
    .optional()
    .isInt({ gt: 0 }).withMessage("id_empleado debe ser un entero"),
  check("fecha_inicio")
    .optional()
    .isISO8601().withMessage("fecha_inicio debe tener formato ISO (YYYY-MM-DD)"),
  check("fecha_fin")
    .optional()
    .isISO8601().withMessage("fecha_fin debe tener formato ISO (YYYY-MM-DD)"),
  check("estado")
    .optional()
    .isIn(["En Proceso", "Completado", "Anulado"]).withMessage("estado debe ser: En Proceso, Completado o Anulado"),
  check("observaciones")
    .optional()
    .isString().isLength({ max: 255 }).withMessage("observaciones inválidas"),
  handleValidationResult
];

export const idPazysalvoValidator = [ validateIdParam, handleValidationResult ];