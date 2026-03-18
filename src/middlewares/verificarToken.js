import jwt from "jsonwebtoken";
import { tokenBlacklist } from "../controllers/auth.controller.js";

export function verificarToken(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token no proporcionado" });
    }
    const token = auth.split(" ")[1];
    
    // Verificar si el token está en la blacklist
    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: "Token revocado. Por favor, inicie sesión nuevamente" });
    }
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
}