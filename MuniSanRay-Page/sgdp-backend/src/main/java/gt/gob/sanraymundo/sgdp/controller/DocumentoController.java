package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.CrearCategoriaDocumentoRequest;
import gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoResponse;
import gt.gob.sanraymundo.sgdp.dto.response.VersionDocumentoResponse;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.service.AuditoriaService;
import gt.gob.sanraymundo.sgdp.service.DocumentoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;

    // -------------------------------------------------------------------------
    // GET /api/documentos/categorias
    // -------------------------------------------------------------------------

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaResponse>> listarCategorias() {
        return ResponseEntity.ok(documentoService.listarCategorias());
    }

    @PostMapping("/categorias")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','OFICIAL')")
    public ResponseEntity<CategoriaResponse> crearCategoria(
            @Valid @RequestBody CrearCategoriaDocumentoRequest request,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            HttpServletRequest httpRequest) {
        CategoriaResponse resp = documentoService.crearCategoria(request);
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(xff, httpRequest),
                TipoAccion.CREATE_CAT, "CATEGORIA_DOC", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.status(201).body(resp);
    }

    @PutMapping("/categorias/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','OFICIAL')")
    public ResponseEntity<CategoriaResponse> actualizarCategoria(
            @PathVariable Long id,
            @Valid @RequestBody CrearCategoriaDocumentoRequest request,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            HttpServletRequest httpRequest) {
        CategoriaResponse resp = documentoService.actualizarCategoria(id, request);
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(xff, httpRequest),
                TipoAccion.UPDATE_CAT, "CATEGORIA_DOC", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/categorias/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','OFICIAL')")
    public ResponseEntity<Void> eliminarCategoria(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xff,
            HttpServletRequest httpRequest) {
        documentoService.eliminarCategoria(id);
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(xff, httpRequest),
                TipoAccion.DELETE_CAT, "CATEGORIA_DOC", id.toString(), "Eliminada");
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // POST /api/documentos
    // -------------------------------------------------------------------------

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'OFICIAL')")
    public ResponseEntity<DocumentoResponse> subirDocumento(
            @RequestPart("file") MultipartFile file,
            @RequestPart("metadata") @Valid SubirDocumentoRequest req,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        DocumentoResponse response = documentoService.subirDocumento(file, req, auth.getName(), ip);
        return ResponseEntity.status(201).body(response);
    }

    // -------------------------------------------------------------------------
    // GET /api/documentos
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<Page<DocumentoResponse>> buscar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String nivelAcceso,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(documentoService.buscar(q, nivelAcceso, estado, pageable));
    }

    // -------------------------------------------------------------------------
    // GET /api/documentos/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<DocumentoResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.obtenerPorId(id));
    }

    // -------------------------------------------------------------------------
    // GET /api/documentos/{id}/descargar
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/descargar")
    public void descargar(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        String ip = extractIp(xForwardedFor, request);
        // prepararDescarga needed for filename/contentType metadata only
        Documento doc = documentoService.prepararDescargaMetadata(id);
        byte[] bytes = documentoService.descargarConVerificacion(id, auth.getName(), ip);

        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + doc.getNombreArchivo() + "\"");
        response.setContentLengthLong(bytes.length);
        response.getOutputStream().write(bytes);
    }

    // -------------------------------------------------------------------------
    // PATCH /api/documentos/{id}/archivar  |  PATCH /api/documentos/{id}/reactivar
    // -------------------------------------------------------------------------

    @PatchMapping("/{id}/archivar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'OFICIAL')")
    public ResponseEntity<DocumentoResponse> archivar(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(documentoService.archivarDocumento(id, auth.getName(), ip));
    }

    @PatchMapping("/{id}/reactivar")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'OFICIAL')")
    public ResponseEntity<DocumentoResponse> reactivar(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(documentoService.reactivarDocumento(id, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // POST /api/documentos/{id}/nueva-version
    // -------------------------------------------------------------------------

    @PostMapping(value = "/{id}/nueva-version", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'OFICIAL')")
    public ResponseEntity<DocumentoResponse> nuevaVersion(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "motivoCambio", required = false) String motivoCambio,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(
                documentoService.subirNuevaVersion(id, file, motivoCambio, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // GET /api/documentos/{id}/versiones
    // -------------------------------------------------------------------------

    @GetMapping("/{id}/versiones")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'OFICIAL')")
    public ResponseEntity<List<VersionDocumentoResponse>> listarVersiones(@PathVariable Long id) {
        return ResponseEntity.ok(documentoService.listarVersiones(id));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String extractIp(String xForwardedFor, HttpServletRequest req) {
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    private Usuario resolveUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", "nombreUsuario", nombreUsuario));
    }
}
