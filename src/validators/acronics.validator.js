import { check } from "express-validator";
import { validateIdParam, handleValidationResult } from "./common.validator.js";

export const createAcronicsValidator = [
	check("id_responsable")
		.exists().withMessage("id_responsable es requerido")
		.bail()
		.isInt({ gt: 0 }).withMessage("id_responsable debe ser un entero"),
	check("id_paz_salvo")
		.exists().withMessage("id_paz_salvo es requerido")
		.bail()
		.isInt({ gt: 0 }).withMessage("id_paz_salvo debe ser un entero"),
	check("fotografia_1").optional().isString().isLength({ max: 255 }),
	check("fotografia_2").optional().isString().isLength({ max: 255 }),
	check("observaciones").optional().isString().isLength({ max: 255 }),
	handleValidationResult
];

export const updateAcronicsValidator = [
	validateIdParam,
	check("id_responsable").optional().isInt({ gt: 0 }),
	check("id_paz_salvo").optional().isInt({ gt: 0 }),
	check("fotografia_1").optional().isString().isLength({ max: 255 }),
	check("fotografia_2").optional().isString().isLength({ max: 255 }),
	check("observaciones").optional().isString().isLength({ max: 255 }),
	handleValidationResult
];

export const idAcronicsValidator = [validateIdParam, handleValidationResult];
