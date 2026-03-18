import { check } from "express-validator";
import { validateIdParam, handleValidationResult } from "./common.validator.js";

const responsableCheck = (field) =>
  check(field).exists().withMessage(`${field} es requerido`).bail().isInt({ gt: 0 }).withMessage(`${field} debe ser un entero`);

export const createLicenciaValidator = [
  check("id_empleado").exists().withMessage("id_empleado es requerido").bail().isInt({ gt: 0 }),
  responsableCheck("responsable_antivirus"),
  check("fotografia_antivirus").optional().isString().isLength({ max: 255 }),
  check("observaciones_antivirus").optional().isString().isLength({ max: 255 }),

  responsableCheck("responsable_copia_seguridad"),
  check("fotografia_copia_seguridad").optional().isString().isLength({ max: 255 }),
  check("observaciones_copia_seguridad").optional().isString().isLength({ max: 255 }),

  responsableCheck("responsable_erp"),
  check("fotografia_erp").optional().isString().isLength({ max: 255 }),
  check("observaciones_erp").optional().isString().isLength({ max: 255 }),

  responsableCheck("responsable_otras_licencias"),
  check("otras_licencias").optional().isString().isLength({ max: 255 }),
  check("fotografia_otras_licencias").optional().isString().isLength({ max: 255 }),
  check("observaciones_otras_licencias").optional().isString().isLength({ max: 255 }),

  handleValidationResult
];

export const updateLicenciaValidator = [
  validateIdParam,
  check("id_empleado").optional().isInt({ gt: 0 }),
  check("responsable_antivirus").optional().isInt({ gt: 0 }),
  check("responsable_copia_seguridad").optional().isInt({ gt: 0 }),
  check("responsable_erp").optional().isInt({ gt: 0 }),
  check("responsable_otras_licencias").optional().isInt({ gt: 0 }),
  check("otras_licencias").optional().isString().isLength({ max: 255 }),
  check(/.*/).optional(), // placeholder para evitar warnings, no afecta
  handleValidationResult
];

export const idLicenciaValidator = [ validateIdParam, handleValidationResult ];