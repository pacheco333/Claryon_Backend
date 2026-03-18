import { createPool } from "mysql2/promise";
import 'dotenv/config.js';

// Usar variables de entorno para la configuración de la base de datos
const DB_HOST = process.env.DB_HOST || "";
const DB_USER = process.env.DB_USER || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_DATABASE = process.env.DB_DATABASE || "";
const DB_PORT = Number(process.env.DB_PORT || 3306);

export const pool = createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function verificarConexionDB({ salirSiFalla = false } = {}) {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.ping();
        } finally {
            connection.release();
        }
        console.log("Conexión a DB: OK ->", DB_HOST, ":", DB_PORT);
        return { ok: true };
    } catch (error) {
        console.error("Error en la conexión a la DB:");
        console.error(" host:", DB_HOST);
        console.error(" port:", DB_PORT);
        console.error(" message:", error.message);
        if (error.code) console.error(" code:", error.code);
        if (error.errno) console.error(" errno:", error.errno);
        console.error(" stack:", error.stack);

        if (salirSiFalla) process.exit(1);
        return { ok: false, error };
    }
}
