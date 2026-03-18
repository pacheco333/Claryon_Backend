import { validationResult, param } from "express-validator";


export const validateIdParam = param("id")
  .exists().withMessage("id es requerido")
  .bail()
  .isInt({ gt: 0 }).withMessage("id debe ser un entero mayor que 0");


  export const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ errors: errors.array() });
};