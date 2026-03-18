import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";
import { pool } from "../config/db.js";

export const generatePazysalvoPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            `SELECT p.*,
                    e.nombres AS empleado_nombres, e.apellidos AS empleado_apellidos,
                    u.nombres AS responsable_nombres, u.apellidos AS responsable_apellidos
             FROM Pazysalvo p
             LEFT JOIN Empleados e ON p.id_empleado = e.id
             LEFT JOIN Usuarios u ON p.id_responsable = u.id
             WHERE p.id = ?`,
            [id]
        );

        if (!rows || rows.length === 0) return res.status(404).json({ message: "Paz y salvo no encontrado" });
        const data = rows[0];

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="pazysalvo-${id}.pdf"`);

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        doc.pipe(res);

        // Encabezado
        doc.fontSize(16).font("Helvetica-Bold").text("Formato Interno - Paz y Salvo", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(9).font("Helvetica").text(`ID: ${data.id}`, { align: "right" });
        doc.moveDown(0.5);
        doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.options.margin, doc.y).stroke();

        // Datos principales
        doc.moveDown(1);
        doc.fontSize(11).font("Helvetica-Bold").text("Empleado:");
        doc.fontSize(10).font("Helvetica")
           .text(`${data.empleado_nombres || ""} ${data.empleado_apellidos || ""}`)
           .moveDown(0.5);

        doc.fontSize(11).font("Helvetica-Bold").text("Responsable:");
        doc.fontSize(10).font("Helvetica")
           .text(`${data.responsable_nombres || ""} ${data.responsable_apellidos || ""}`)
           .moveDown(0.5);

        doc.fontSize(11).font("Helvetica-Bold").text("Observaciones:");
        doc.fontSize(10).font("Helvetica").text(data.observaciones || "—", { align: "left" });

        // Fecha
        doc.moveDown(1);
        const fecha = data.fecha_creacion ? new Date(data.fecha_creacion).toLocaleString() : "";
        doc.fontSize(9).text(`Fecha de creación: ${fecha}`);

        // Función auxiliar para imágenes (URLs o rutas locales)
        const renderImageIfExists = async (imgPath, x, y, opts = {}) => {
            if (!imgPath) return;
            try {
                if (/^https?:\/\//i.test(imgPath)) {
                    const resp = await axios.get(imgPath, { responseType: "arraybuffer" });
                    doc.image(Buffer.from(resp.data), x, y, opts);
                } else if (fs.existsSync(imgPath)) {
                    doc.image(imgPath, x, y, opts);
                }
            } catch (err) {
                // ignorar errores de imagen
            }
        };

        // Añadir imágenes si existen
        const imageY = doc.y + 10;
        await renderImageIfExists(data.fotografia_1, doc.x, imageY, { fit: [220, 160] });
        await renderImageIfExists(data.fotografia_2, doc.x + 240, imageY, { fit: [220, 160] });

        // Firmas
        doc.moveDown(12);
        const colWidth = (doc.page.width - doc.options.margin * 2) / 2;
        const startX = doc.x;
        const startY = doc.y;
        doc.lineWidth(0.5);
        doc.moveTo(startX, startY).lineTo(startX + colWidth - 20, startY).stroke();
        doc.text("Firma Responsable", startX, startY + 6, { width: colWidth - 20, align: "left" });
        doc.moveTo(startX + colWidth + 20, startY).lineTo(startX + colWidth * 2, startY).stroke();
        doc.text("Firma Empleado", startX + colWidth + 20, startY + 6, { width: colWidth - 20, align: "left" });

        doc.end();
    } catch (error) {
        console.error("generatePazysalvoPdf:", error);
        if (!res.headersSent) return res.status(500).json({ message: "Error al generar PDF", error: error.message });
    }
};