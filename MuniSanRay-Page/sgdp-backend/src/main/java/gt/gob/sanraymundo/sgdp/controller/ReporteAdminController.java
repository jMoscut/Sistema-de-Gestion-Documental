package gt.gob.sanraymundo.sgdp.controller;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.RegistroAuditoria;
import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.AuditoriaRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.service.AuditoriaService;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reportes")
@RequiredArgsConstructor
public class ReporteAdminController {

    private final SolicitudRepository solicitudRepository;
    private final DocumentoRepository documentoRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    // -------------------------------------------------------------------------
    // Solicitudes CSV
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/solicitudes/csv")
    public void exportarSolicitudesCsv(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"solicitudes.csv\"");

        List<SolicitudInformacion> solicitudes = solicitudRepository.findAll();

        try (PrintWriter writer = response.getWriter()) {
            writer.write('﻿'); // BOM para Excel UTF-8
            writer.println("Código,Solicitante,Correo,Fecha Recepción,Fecha Límite,Estado,Oficial Asignado,Fecha Respuesta");

            for (SolicitudInformacion s : solicitudes) {
                String oficialNombre = s.getOficialAsignado() != null
                        ? s.getOficialAsignado().getNombreCompleto()
                        : "";
                writer.println(
                    q(s.getCodigoExpediente()) + "," +
                    q(s.getNombreSolicitante()) + "," +
                    q(s.getCorreoSolicitante()) + "," +
                    q(s.getFechaRecepcion() != null ? s.getFechaRecepcion().toString() : "") + "," +
                    q(s.getFechaLimite() != null ? s.getFechaLimite().toString() : "") + "," +
                    q(s.getEstado() != null ? s.getEstado().name() : "") + "," +
                    q(oficialNombre) + "," +
                    q(s.getFechaRespuesta() != null ? s.getFechaRespuesta().toString() : "")
                );
            }
        }

        auditarExportacion(auth, httpRequest, "solicitudes.csv", TipoAccion.EXPORT_REPORT);
    }

    // -------------------------------------------------------------------------
    // Solicitudes PDF
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/solicitudes/pdf")
    public void exportarSolicitudesPdf(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"solicitudes.pdf\"");

        List<SolicitudInformacion> solicitudes = solicitudRepository.findAll();

        PdfWriter pdfWriter = new PdfWriter(response.getOutputStream());
        PdfDocument pdfDoc = new PdfDocument(pdfWriter);
        try (Document document = new Document(pdfDoc)) {

            document.add(encabezado("Reporte de Solicitudes LAIP"));
            document.add(subTitulo("Decreto 57-2008 — Municipalidad de San Raymundo, Guatemala"));
            document.add(fechaGeneracion());
            document.add(new Paragraph(" "));

            float[] anchos = {14, 16, 16, 11, 11, 12, 16, 14};
            Table table = new Table(UnitValue.createPercentArray(anchos)).useAllAvailableWidth();

            agregarEncabezadoTabla(table,
                "Código", "Solicitante", "Correo",
                "Recepción", "Límite", "Estado",
                "Oficial", "Respuesta");

            for (SolicitudInformacion s : solicitudes) {
                String oficial = s.getOficialAsignado() != null
                        ? s.getOficialAsignado().getNombreCompleto() : "";
                agregarFilaTabla(table,
                    s.getCodigoExpediente(),
                    s.getNombreSolicitante(),
                    s.getCorreoSolicitante(),
                    s.getFechaRecepcion() != null ? s.getFechaRecepcion().toString() : "",
                    s.getFechaLimite() != null ? s.getFechaLimite().toString() : "",
                    s.getEstado() != null ? s.getEstado().name() : "",
                    oficial,
                    s.getFechaRespuesta() != null ? s.getFechaRespuesta().toString() : "");
            }

            document.add(table);
            document.add(pie(solicitudes.size() + " registro(s)"));
        }

        auditarExportacion(auth, httpRequest, "solicitudes.pdf", TipoAccion.EXPORT_REPORT);
    }

    // -------------------------------------------------------------------------
    // Documentos CSV
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/documentos/csv")
    public void exportarDocumentosCsv(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"documentos.csv\"");

        List<Documento> documentos = documentoRepository.findAll();

        try (PrintWriter writer = response.getWriter()) {
            writer.write('﻿');
            writer.println("Código,Título,Categoría,Unidad Origen,Fecha Emisión,Nivel Acceso,Estado,Tamaño (bytes),Registrado Por");

            for (Documento d : documentos) {
                String categoria = d.getCategoria() != null ? d.getCategoria().getNombre() : "";
                String registradoPor = d.getRegistradoPor() != null ? d.getRegistradoPor().getNombreCompleto() : "";
                writer.println(
                    q(d.getCodigo()) + "," +
                    q(d.getTitulo()) + "," +
                    q(categoria) + "," +
                    q(d.getUnidadOrigen()) + "," +
                    q(d.getFechaEmision() != null ? d.getFechaEmision().toString() : "") + "," +
                    q(d.getNivelAcceso() != null ? d.getNivelAcceso().name() : "") + "," +
                    q(d.getEstado()) + "," +
                    q(d.getTamanoBytes() != null ? d.getTamanoBytes().toString() : "") + "," +
                    q(registradoPor)
                );
            }
        }

        auditarExportacion(auth, httpRequest, "documentos.csv", TipoAccion.EXPORT_REPORT);
    }

    // -------------------------------------------------------------------------
    // Documentos PDF
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/documentos/pdf")
    public void exportarDocumentosPdf(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"documentos.pdf\"");

        List<Documento> documentos = documentoRepository.findAll();

        PdfWriter pdfWriter = new PdfWriter(response.getOutputStream());
        PdfDocument pdfDoc = new PdfDocument(pdfWriter);
        try (Document document = new Document(pdfDoc)) {

            document.add(encabezado("Reporte de Documentos"));
            document.add(subTitulo("Repositorio Documental — Municipalidad de San Raymundo, Guatemala"));
            document.add(fechaGeneracion());
            document.add(new Paragraph(" "));

            float[] anchos = {14, 22, 16, 14, 11, 11, 12};
            Table table = new Table(UnitValue.createPercentArray(anchos)).useAllAvailableWidth();

            agregarEncabezadoTabla(table,
                "Código", "Título", "Categoría",
                "Unidad", "Emisión", "Acceso", "Estado");

            for (Documento d : documentos) {
                String categoria = d.getCategoria() != null ? d.getCategoria().getNombre() : "";
                agregarFilaTabla(table,
                    d.getCodigo(),
                    d.getTitulo(),
                    categoria,
                    d.getUnidadOrigen() != null ? d.getUnidadOrigen() : "",
                    d.getFechaEmision() != null ? d.getFechaEmision().toString() : "",
                    d.getNivelAcceso() != null ? d.getNivelAcceso().name() : "",
                    d.getEstado());
            }

            document.add(table);
            document.add(pie(documentos.size() + " documento(s)"));
        }

        auditarExportacion(auth, httpRequest, "documentos.pdf", TipoAccion.EXPORT_REPORT);
    }

    // -------------------------------------------------------------------------
    // Auditoria CSV
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/auditoria/csv")
    public void exportarAuditoriaCsv(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"auditoria.csv\"");

        List<RegistroAuditoria> registros = auditoriaRepository
                .findAll(Sort.by(Sort.Direction.DESC, "timestampUtc"));

        try (PrintWriter writer = response.getWriter()) {
            writer.write('﻿');
            writer.println("ID,Fecha/Hora (UTC),Usuario,IP Origen,Acción,Tipo Objeto,ID Objeto,Descripción,Resultado");
            for (RegistroAuditoria r : registros) {
                writer.println(
                    q(r.getId() != null ? r.getId().toString() : "") + "," +
                    q(r.getTimestampUtc() != null ? r.getTimestampUtc().toString() : "") + "," +
                    q(r.getUsuarioDesc()) + "," +
                    q(r.getIpOrigen()) + "," +
                    q(r.getAccion()) + "," +
                    q(r.getObjetoTipo()) + "," +
                    q(r.getObjetoId()) + "," +
                    q(r.getObjetoDesc()) + "," +
                    q(r.getResultado())
                );
            }
        }

        auditarExportacion(auth, httpRequest, "auditoria.csv", TipoAccion.EXPORT_LOG);
    }

    // -------------------------------------------------------------------------
    // Auditoria PDF
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/auditoria/pdf")
    public void exportarAuditoriaPdf(
            HttpServletResponse response,
            Authentication auth,
            HttpServletRequest httpRequest
    ) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=\"auditoria.pdf\"");

        List<RegistroAuditoria> registros = auditoriaRepository
                .findAll(Sort.by(Sort.Direction.DESC, "timestampUtc"));

        PdfWriter pdfWriter = new PdfWriter(response.getOutputStream());
        PdfDocument pdfDoc = new PdfDocument(pdfWriter);
        try (Document document = new Document(pdfDoc)) {

            document.add(encabezado("Registro de Auditoría"));
            document.add(subTitulo("Trazabilidad de acciones — Municipalidad de San Raymundo, Guatemala"));
            document.add(fechaGeneracion());
            document.add(new Paragraph(" "));

            float[] anchos = {8, 16, 14, 13, 17, 12, 10, 10};
            Table table = new Table(UnitValue.createPercentArray(anchos)).useAllAvailableWidth();

            agregarEncabezadoTabla(table,
                "ID", "Fecha/Hora", "Usuario", "IP", "Acción", "Descripción", "Objeto", "Resultado");

            for (RegistroAuditoria r : registros) {
                agregarFilaTabla(table,
                    r.getId() != null ? r.getId().toString() : "",
                    r.getTimestampUtc() != null ? r.getTimestampUtc().toString().replace("T", " ") : "",
                    r.getUsuarioDesc() != null ? r.getUsuarioDesc() : "",
                    r.getIpOrigen() != null ? r.getIpOrigen() : "",
                    r.getAccion() != null ? r.getAccion() : "",
                    r.getObjetoDesc() != null ? r.getObjetoDesc() : "",
                    r.getObjetoId() != null ? r.getObjetoId() : "",
                    r.getResultado() != null ? r.getResultado() : "");
            }

            document.add(table);
            document.add(pie(registros.size() + " registro(s) de auditoría"));
        }

        auditarExportacion(auth, httpRequest, "auditoria.pdf", TipoAccion.EXPORT_LOG);
    }

    // -------------------------------------------------------------------------
    // Helpers PDF
    // -------------------------------------------------------------------------

    private Paragraph encabezado(String texto) {
        return new Paragraph(texto)
                .setBold()
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Paragraph subTitulo(String texto) {
        return new Paragraph(texto)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.DARK_GRAY);
    }

    private Paragraph fechaGeneracion() {
        return new Paragraph("Generado: " + LocalDate.now())
                .setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(ColorConstants.GRAY);
    }

    private Paragraph pie(String texto) {
        return new Paragraph(texto)
                .setFontSize(8)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFontColor(ColorConstants.GRAY)
                .setMarginTop(4);
    }

    private void agregarEncabezadoTabla(Table table, String... headers) {
        for (String h : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(h).setBold().setFontSize(7))
                    .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        }
    }

    private void agregarFilaTabla(Table table, String... valores) {
        for (String v : valores) {
            table.addCell(new Cell()
                    .add(new Paragraph(v != null ? v : "").setFontSize(6.5f)));
        }
    }

    // -------------------------------------------------------------------------
    // Helpers CSV
    // -------------------------------------------------------------------------

    private String q(String val) {
        if (val == null) return "\"\"";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    // -------------------------------------------------------------------------
    // Helpers comunes
    // -------------------------------------------------------------------------

    private void auditarExportacion(Authentication auth, HttpServletRequest req,
                                    String archivo, TipoAccion accion) {
        String nombreUsuario = auth.getName();
        String ip = extractIp(req);
        usuarioRepository.findByNombreUsuario(nombreUsuario).ifPresent((Usuario u) ->
            auditoriaService.registrarExito(
                u.getId(), nombreUsuario, ip,
                accion,
                "REPORTE", archivo,
                "Exportación: " + archivo
            )
        );
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
