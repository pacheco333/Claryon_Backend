import { check } from "express-validator";
import { validateIdParam, handleValidationResult } from "./common.validator.js";

export const createMicrosoftValidator = [
  check("id_responsable")
    .exists().withMessage("id_responsable es requerido")
    .bail()
    .isInt({ gt: 0 }).withMessage("id_responsable debe ser un entero"),
  check("id_empleado")
    .exists().withMessage("id_empleado es requerido")
    .bail()
    .isInt({ gt: 0 }).withMessage("id_empleado debe ser un entero"),
  check("fotografia_onedrive").optional().isString().isLength({ max: 255 }),
  check("fotografia_buzon").optional().isString().isLength({ max: 255 }),
  check("observaciones").optional().isString().isLength({ max: 255 }),
  handleValidationResult
];

export const updateMicrosoftValidator = [
  validateIdParam,
  check("id_responsable").optional().isInt({ gt: 0 }),
  check("id_empleado").optional().isInt({ gt: 0 }),
  check("fotografia_onedrive").optional().isString().isLength({ max: 255 }),
  check("fotografia_buzon").optional().isString().isLength({ max: 255 }),
  check("observaciones").optional().isString().isLength({ max: 255 }),
  handleValidationResult
];

export const idMicrosoftValidator = [ validateIdParam, handleValidationResult ];