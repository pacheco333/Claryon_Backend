import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

// Blacklist de tokens revocados (en memoria)
// Para producción, considera usar Redis o la base de datos
const tokenBlacklist = new Set();

export const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        if (!correo || !contrasena) 
            return res.status(400).json({ message: "correo y contrasena requeridos" });

        const [rows] = await pool.query("SELECT * FROM Usuarios WHERE correo = ? AND eliminado = FALSE", [correo]);
        const user = rows?.[0];
        if (!user)
            return res.status(401).json({ message: "Credenciales inválidas" });

        // Verificar si el usuario está activo (campo `activo` = 1)
        // Si no está activo, devolver mensaje indicando que el usuario no está activo
        if (user.activo === 0 || user.activo === '0') {
            return res.status(403).json({ 
                status: "inactivo",
                message: "El usuario no está activo",
            });
        }

        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match)
            return res.status(401).json({ message: "Credenciales inválidas" });

        const payload = { id: user.id, correo: user.correo, rol: user.rol };
        const secret = process.env.JWT_SECRET;

        if (!secret) 
            return res.status(500).json({ message: "JWT_SECRET no definido en el entorno" });

        const token = jwt.sign(payload, secret, {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        });

        return res.json({
            token,
            user: {
                id: user.id,
                nombres: user.nombres,
                apellidos: user.apellidos,
                correo: user.correo,
                rol: user.rol,
                activo: user.activo === 1 || user.activo === '1' ? 1 : 0
            }
        });
    } catch (error) {
        console.error("login:", error);
        return res.status(500).json({ message: "Error en login", error: error.message });
    }
};

export const validateToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.body?.token;

        if (!token) return res.status(400).json({ message: "Token requerido en Authorization header o body.token" });

        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ message: "JWT_SECRET no definido en el entorno" });

        try {
            const payload = jwt.verify(token, secret);
            const now = Math.floor(Date.now() / 1000);
            const exp = payload.exp || null;
            const secondsLeft = exp ? exp - now : null;
            return res.json({ valid: true, expired: false, payload, expiresAt: exp ? new Date(exp * 1000) : null, secondsLeft });
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                const decoded = jwt.decode(token) || {};
                const exp = decoded.exp || null;
                const expiredAt = exp ? new Date(exp * 1000) : null;
                return res.status(200).json({ valid: false, expired: true, expiresAt: expiredAt });
            }
            return res.status(400).json({ valid: false, expired: false, message: 'Token inválido' });
        }
    } catch (error) {
        console.error('validateToken:', error);
        return res.status(500).json({ message: 'Error validando token', error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({ message: "Token requerido en Authorization header" });
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            return res.status(500).json({ message: "JWT_SECRET no definido en el entorno" });
        }

        try {
            const payload = jwt.verify(token, secret);
            // Agregar el token a la blacklist con su tiempo de expiración
            tokenBlacklist.add(token);
            
            // Limpiar tokens expirados de la blacklist
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                tokenBlacklist.delete(token);
            }

            return res.json({ 
                message: "Sesión cerrada exitosamente",
                logout: true 
            });
        } catch (err) {
            return res.status(400).json({ message: "Token inválido" });
        }
    } catch (error) {
        console.error('logout:', error);
        return res.status(500).json({ message: 'Error en logout', error: error.message });
    }
};

export { tokenBlacklist };
