//* importaciones
import { validationResult } from "express-validator";


//? Creamos helper de validacion para manejar la validacion.
export default function validateResult(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}