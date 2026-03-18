import { check } from "express-validator";
import { validateIdParam, handleValidationResult } from "./common.validator.js";

export const createLineaValidator = [
  check("id_responsable")
    .exists().withMessage("id_responsable es requerido")
    .bail()
    .isInt({ gt: 0 }).withMessage("id_responsable debe ser un entero positivo"),
  check("id_paz_salvo")
    .exists().withMessage("id_paz_salvo es requerido")
    .bail()
    .isInt({ gt: 0 }).withMessage("id_paz_salvo debe ser un entero positivo"),
  check("numero_linea")
    .optional()
    .isString().withMessage("numero_linea debe ser texto")
    .isLength({ max: 100 }).withMessage("numero_linea no puede superar 100 caracteres"),
  check("observaciones")
    .optional()
    .isString().withMessage("observaciones debe ser texto")
    .isLength({ max: 255 }).withMessage("observaciones no puede superar 255 caracteres"),
  handleValidationResult,
];

export const updateLineaValidator = [
  validateIdParam,
  check("id_responsable").optional().isInt({ gt: 0 }),
  check("id_paz_salvo").optional().isInt({ gt: 0 }),
  check("numero_linea").optional().isString().isLength({ max: 100 }),
  check("observaciones").optional().isString().isLength({ max: 255 }),
  handleValidationResult,
];

export const idLineaValidator = [validateIdParam, handleValidationResult];
