package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.PresentarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CarpetaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoResponse;
import gt.gob.sanraymundo.sgdp.dto.response.OficioBusquedaResultado;
import gt.gob.sanraymundo.sgdp.dto.response.SeguimientoResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudPublicaResponse;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import gt.gob.sanraymundo.sgdp.model.entity.InformacionOficio;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import gt.gob.sanraymundo.sgdp.repository.CategoriaDocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoSpecifications;
import gt.gob.sanraymundo.sgdp.service.HashService;
import gt.gob.sanraymundo.sgdp.service.InformacionOficioService;
import gt.gob.sanraymundo.sgdp.service.OficioAdminService;
import gt.gob.sanraymundo.sgdp.service.R2StorageService;
import gt.gob.sanraymundo.sgdp.service.SolicitudService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/publico")
@RequiredArgsConstructor
public class PublicoController {

    private final InformacionOficioService oficioService;
    private final SolicitudService solicitudService;
    private final R2StorageService r2StorageService;
    private final HashService hashService;
    private final OficioAdminService oficioAdminService;
    private final DocumentoRepository documentoRepository;
    private final CategoriaDocumentoRepository categoriaDocumentoRepository;

    // -------------------------------------------------------------------------
    // Repositorio de Documentos Públicos
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    @GetMapping("/documentos")
    public ResponseEntity<Page<DocumentoResponse>> buscarDocumentos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoriaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        var pageable = PageRequest.of(page, size);
        Page<Documento> result;
        if (q != null && !q.isBlank()) {
            var spec = DocumentoSpecifications.and(
                    DocumentoSpecifications.texto(q),
                    DocumentoSpecifications.nivelAcceso(NivelAcceso.PUBLICO.name()),
                    DocumentoSpecifications.estado("VIGENTE"),
                    DocumentoSpecifications.categoriaId(categoriaId)
            );
            result = documentoRepository.findAll(spec, pageable);
        } else {
            result = documentoRepository.buscarPublicos(categoriaId, pageable);
        }
        return ResponseEntity.ok(result.map(DocumentoResponse::from));
    }

    @GetMapping("/documentos/categorias")
    public ResponseEntity<List<CategoriaResponse>> categoriasDocumentos() {
        return ResponseEntity.ok(
                categoriaDocumentoRepository.findAll(Sort.by("nombre")).stream()
                        .map(CategoriaResponse::from)
                        .toList()
        );
    }

    @GetMapping("/documentos/{id}/descargar")
    public void descargarDocumentoPublico(
            @PathVariable Long id,
            HttpServletResponse response
    ) throws IOException {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        if (doc.getNivelAcceso() != NivelAcceso.PUBLICO) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Documento no público");
            return;
        }

        byte[] bytes = r2StorageService.downloadBytes(doc.getR2Key());
        String hashCalculado = hashService.sha256(bytes);
        if (!hashCalculado.equals(doc.getHashSha256())) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "Error de integridad del archivo");
            return;
        }

        String mime = mimeTypeFromNombreArchivo(doc.getNombreArchivo());
        String disposition = "application/pdf".equals(mime) ? "inline" : "attachment";
        response.setContentType(mime);
        response.setHeader("Content-Disposition", disposition + "; filename=\"" + doc.getNombreArchivo() + "\"");
        response.setContentLengthLong(bytes.length);
        response.getOutputStream().write(bytes);
    }

    private String mimeTypeFromNombreArchivo(String nombreArchivo) {
        String nombre = nombreArchivo == null ? "" : nombreArchivo.toLowerCase();
        if (nombre.endsWith(".pdf")) return "application/pdf";
        if (nombre.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (nombre.endsWith(".doc")) return "application/msword";
        if (nombre.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (nombre.endsWith(".xls")) return "application/vnd.ms-excel";
        return "application/octet-stream";
    }

    // -------------------------------------------------------------------------
    // Información de Oficio (Art. 10 LAIP)
    // -------------------------------------------------------------------------

    @GetMapping("/oficio/{id}/archivo")
    public void descargarArchivoOficio(@PathVariable Long id, HttpServletResponse response) throws IOException {
        InformacionOficio oficio = oficioService.obtenerEntidadPorId(id);
        if (oficio.getArchivoR2Key() == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Sin archivo adjunto");
            return;
        }
        ResponseInputStream<GetObjectResponse> stream = r2StorageService.download(oficio.getArchivoR2Key());
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "inline; filename=\"" + oficio.getArchivoNombre() + "\"");
        StreamUtils.copy(stream, response.getOutputStream());
    }

    @GetMapping("/oficio/v2/buscar")
    public ResponseEntity<List<OficioBusquedaResultado>> buscarOficio(
            @RequestParam String q,
            @RequestParam(defaultValue = "LAIP") String seccion) {
        if (q == null || q.isBlank() || q.length() < 2) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(oficioAdminService.buscar(q.trim(), seccion));
    }

    @GetMapping("/oficio/v2/categorias")
    public ResponseEntity<List<CategoriaOficioResponse>> listarCategoriasV2(
            @RequestParam(defaultValue = "LAIP") String seccion) {
        return ResponseEntity.ok(oficioAdminService.listarCategorias(seccion));
    }

    @GetMapping("/oficio/v2/categorias/{catId}/carpetas")
    public ResponseEntity<List<CarpetaOficioResponse>> listarCarpetasPublico(@PathVariable Integer catId) {
        return ResponseEntity.ok(oficioAdminService.listarCarpetas(catId));
    }

    @GetMapping("/oficio/v2/carpetas/{carpetaId}/documentos")
    public ResponseEntity<List<DocumentoOficioResponse>> listarDocumentosPublico(@PathVariable Long carpetaId) {
        return ResponseEntity.ok(oficioAdminService.listarDocumentos(carpetaId));
    }

    @GetMapping("/oficio/v2/documentos/{docId}/archivo")
    public void descargarDocumentoOficioPublico(@PathVariable Long docId, HttpServletResponse response) throws IOException {
        DocumentoOficio doc = oficioAdminService.obtenerDocumentoEntidad(docId);
        ResponseInputStream<GetObjectResponse> stream = r2StorageService.download(doc.getArchivoR2Key());
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "inline; filename=\"" + doc.getArchivoNombre() + "\"");
        StreamUtils.copy(stream, response.getOutputStream());
    }

    // -------------------------------------------------------------------------
    // Solicitudes de Información
    // -------------------------------------------------------------------------

    @PostMapping("/solicitudes")
    public ResponseEntity<SolicitudPublicaResponse> presentarSolicitud(
            @Valid @RequestBody PresentarSolicitudRequest request,
            HttpServletRequest httpRequest) {
        String ipOrigen = obtenerIpOrigen(httpRequest);
        SolicitudPublicaResponse response = solicitudService.presentarSolicitud(request, ipOrigen);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/solicitudes/seguimiento/{codigo}")
    public ResponseEntity<SeguimientoResponse> seguimiento(@PathVariable String codigo) {
        return ResponseEntity.ok(solicitudService.consultarSeguimiento(codigo));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String obtenerIpOrigen(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
