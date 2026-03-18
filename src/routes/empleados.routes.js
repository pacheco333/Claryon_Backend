import { Router } from "express";
import {
//    getEmpleadosFiltered,
    getEmpleadosPaginated,
    postEmpleados,
    getEmpleadoPorId,
    putEmpleado,
    deleteEmpleado
} from "../controllers/empleados.controller.js";
import {
    validatorCreateEmpleado,
    validatorQueryEmpleados,
    validatorUpdateEmpleado
} from "../validators/empleados.validators.js";
import { verificarToken } from "../middlewares/verificarToken.js";

const router = Router();

// NOTA: el server monta este archivo en /api/empleados, por eso aquí usamos rutas relativas.

/* Listar empleados (GET /api/empleados) */
//router.get("/filtro", verificarToken, validatorQueryEmpleados, getEmpleadosFiltered);

// /api/empleados/paginated -> páginas fijas de 10
router.get("/paginated", verificarToken, validatorQueryEmpleados, getEmpleadosPaginated);

/* Crear empleado (POST /api/empleados) */
router.post("/", verificarToken, validatorCreateEmpleado, postEmpleados);

// Operaciones por id: /api/empleados/:id
router.get("/:id", verificarToken, getEmpleadoPorId);

router.put("/:id", verificarToken, validatorUpdateEmpleado, putEmpleado);

router.delete("/:id", verificarToken, deleteEmpleado);

export default router;
