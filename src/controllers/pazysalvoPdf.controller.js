import PDFDocument from "pdfkit";
import { pool } from "../config/db.js";

const formatDate = (value) => {
    if (!value) return "No disponible";

    if (value instanceof Date) {
        const day = String(value.getDate()).padStart(2, "0");
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const year = value.getFullYear();
        return `${day}/${month}/${year}`;
    }

    const dateStr = String(value).slice(0, 10);
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return "No disponible";
};

export const descargarPazysalvoPdf = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT 
                ps.id,
                ps.id_empleado,
                ps.fecha_inicio,
                ps.fecha_fin,
                ps.estado,
                e.nombres,
                e.apellidos,
                e.correo,
                e.puesto,
                e.compania,
                e.area,
                TRIM(CONCAT(IFNULL(u.nombres, ''), ' ', IFNULL(u.apellidos, ''))) AS creado_por_nombre
             FROM PazSalvos ps
             LEFT JOIN Empleados e ON ps.id_empleado = e.id
             LEFT JOIN Usuarios u ON ps.id_creado_por = u.id
             WHERE ps.id = ? AND ps.eliminado = FALSE AND ps.estado != 'Anulado'`,
            [id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Paz y salvo no encontrado" });
        }

        const pazSalvo = rows[0];
        if (pazSalvo.estado !== "Completado") {
            return res.status(400).json({ message: "Solo se puede descargar el PDF de paz y salvos completados" });
        }

        const fullName = `${pazSalvo.nombres || ""} ${pazSalvo.apellidos || ""}`.trim() || "No disponible";
        const fileName = `paz_y_salvo_${pazSalvo.id}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        doc.pipe(res);

        doc.fontSize(20).text("PAZ Y SALVO", { align: "center" });
        doc.moveDown(1.5);

        doc.fontSize(13).text("Informacion del paz salvo", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`ID Paz y Salvo: ${pazSalvo.id}`);
        doc.text(`Creado por: ${pazSalvo.creado_por_nombre || "No disponible"}`);
        doc.text(`Fecha de inicio: ${formatDate(pazSalvo.fecha_inicio)}`);
        doc.text(`Fecha de fin: ${formatDate(pazSalvo.fecha_fin)}`);
        doc.moveDown();

        doc.fontSize(13).text("Informacion del colaborador", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`ID Empleado: ${pazSalvo.id_empleado}`);
        doc.text(`Nombre: ${fullName}`);
        doc.text(`Correo: ${pazSalvo.correo || "No disponible"}`);
        doc.text(`Puesto: ${pazSalvo.puesto || "No disponible"}`);
        doc.text(`Area: ${pazSalvo.area || "No disponible"}`);
        doc.text(`Compania: ${pazSalvo.compania || "No disponible"}`);

        doc.end();
    } catch (error) {
        console.error("descargarPazysalvoPdf:", error);
        return res.status(500).json({
            message: "Error al generar el PDF de paz y salvo",
            error: error.message
        });
    }
};
