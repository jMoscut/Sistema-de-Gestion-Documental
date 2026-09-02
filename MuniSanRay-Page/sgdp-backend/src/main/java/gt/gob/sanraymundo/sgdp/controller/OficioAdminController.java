package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.CrearCarpetaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearCategoriaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CarpetaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.OficioBusquedaResultado;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.service.AuditoriaService;
import gt.gob.sanraymundo.sgdp.service.OficioAdminService;
import gt.gob.sanraymundo.sgdp.service.R2StorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/oficio")
@RequiredArgsConstructor
public class OficioAdminController {

    private final OficioAdminService oficioAdminService;
    private final R2StorageService r2StorageService;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    // ── Categorías ────────────────────────────────────────────────────────────

    @GetMapping("/categorias")
    public ResponseEntity<List<CategoriaOficioResponse>> listarCategorias(
            @RequestParam(defaultValue = "LAIP") String seccion) {
        return ResponseEntity.ok(oficioAdminService.listarCategorias(seccion));
    }

    @PostMapping("/categorias")
    public ResponseEntity<CategoriaOficioResponse> crearCategoria(
            @Valid @RequestBody CrearCategoriaOficioRequest request,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        CategoriaOficioResponse resp = oficioAdminService.crearCategoria(request);
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "CATEGORIA_OFICIO", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.status(201).body(resp);
    }

    @PutMapping("/categorias/{catId}")
    public ResponseEntity<CategoriaOficioResponse> actualizarCategoria(
            @PathVariable Integer catId,
            @Valid @RequestBody CrearCategoriaOficioRequest request,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        CategoriaOficioResponse resp = oficioAdminService.actualizarCategoria(catId, request.getNombre());
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.UPDATE_CAT, "CATEGORIA_OFICIO", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/categorias/{catId}")
    public ResponseEntity<Void> eliminarCategoria(
            @PathVariable Integer catId,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        Usuario usuario = resolveUsuario(auth.getName());
        oficioAdminService.eliminarCategoria(catId);
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "CATEGORIA_OFICIO", catId.toString(), "Eliminada");
        return ResponseEntity.noContent().build();
    }

    // ── Búsqueda ──────────────────────────────────────────────────────────────

    @GetMapping("/buscar")
    public ResponseEntity<List<OficioBusquedaResultado>> buscar(
            @RequestParam String q,
            @RequestParam(defaultValue = "LAIP") String seccion) {
        if (q == null || q.isBlank() || q.length() < 2) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(oficioAdminService.buscar(q.trim(), seccion));
    }

    // ── Carpetas ──────────────────────────────────────────────────────────────

    @GetMapping("/categorias/{catId}/carpetas")
    public ResponseEntity<List<CarpetaOficioResponse>> listarCarpetas(@PathVariable Integer catId) {
        return ResponseEntity.ok(oficioAdminService.listarCarpetas(catId));
    }

    @PostMapping("/categorias/{catId}/carpetas")
    public ResponseEntity<CarpetaOficioResponse> crearCarpeta(
            @PathVariable Integer catId,
            @Valid @RequestBody CrearCarpetaOficioRequest request,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        Usuario usuario = resolveUsuario(auth.getName());
        CarpetaOficioResponse resp = oficioAdminService.crearCarpeta(catId, request, usuario);
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "CARPETA_OFICIO", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.status(201).body(resp);
    }

    @PutMapping("/carpetas/{carpetaId}")
    public ResponseEntity<CarpetaOficioResponse> actualizarCarpeta(
            @PathVariable Long carpetaId,
            @Valid @RequestBody CrearCarpetaOficioRequest request,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        CarpetaOficioResponse resp = oficioAdminService.actualizarCarpeta(carpetaId, request);
        Usuario usuario = resolveUsuario(auth.getName());
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.UPDATE_CAT, "CARPETA_OFICIO", resp.getId().toString(), resp.getNombre());
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/carpetas/{carpetaId}")
    public ResponseEntity<Void> eliminarCarpeta(
            @PathVariable Long carpetaId,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        Usuario usuario = resolveUsuario(auth.getName());
        oficioAdminService.eliminarCarpeta(carpetaId);
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "CARPETA_OFICIO", carpetaId.toString(), "Eliminada");
        return ResponseEntity.noContent().build();
    }

    // ── Documentos ────────────────────────────────────────────────────────────

    @GetMapping("/carpetas/{carpetaId}/documentos")
    public ResponseEntity<List<DocumentoOficioResponse>> listarDocumentos(@PathVariable Long carpetaId) {
        return ResponseEntity.ok(oficioAdminService.listarDocumentos(carpetaId));
    }

    @GetMapping("/documentos")
    public ResponseEntity<List<DocumentoOficioResponse>> listarTodosDocumentos() {
        return ResponseEntity.ok(oficioAdminService.listarTodosDocumentos());
    }

    @PostMapping(value = "/carpetas/{carpetaId}/documentos", consumes = "multipart/form-data")
    public ResponseEntity<DocumentoOficioResponse> subirDocumento(
            @PathVariable Long carpetaId,
            @RequestPart("datos") @Valid SubirDocumentoOficioRequest request,
            @RequestPart("archivo") MultipartFile archivo,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        Usuario usuario = resolveUsuario(auth.getName());
        DocumentoOficioResponse resp = oficioAdminService.subirDocumento(carpetaId, request, archivo, usuario);
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "DOCUMENTO_OFICIO", resp.getId().toString(), resp.getTitulo());
        return ResponseEntity.status(201).body(resp);
    }

    @DeleteMapping("/documentos/{docId}")
    public ResponseEntity<Void> eliminarDocumento(
            @PathVariable Long docId,
            Authentication auth, HttpServletRequest httpRequest
    ) {
        Usuario usuario = resolveUsuario(auth.getName());
        oficioAdminService.eliminarDocumento(docId);
        auditoriaService.registrarExito(usuario.getId(), auth.getName(), extractIp(httpRequest),
                TipoAccion.PUBLISH_OFICIO, "DOCUMENTO_OFICIO", docId.toString(), "Eliminado");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/documentos/{docId}/archivo")
    public void descargarDocumento(@PathVariable Long docId, HttpServletResponse response) throws IOException {
        DocumentoOficio doc = oficioAdminService.obtenerDocumentoEntidad(docId);
        ResponseInputStream<GetObjectResponse> stream = r2StorageService.download(doc.getArchivoR2Key());
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "inline; filename=\"" + doc.getArchivoNombre() + "\"");
        StreamUtils.copy(stream, response.getOutputStream());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Usuario resolveUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", "nombreUsuario", nombreUsuario));
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
