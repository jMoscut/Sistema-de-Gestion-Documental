package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.ActualizarUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResetPasswordRequest;
import gt.gob.sanraymundo.sgdp.dto.response.UsuarioResponse;
import gt.gob.sanraymundo.sgdp.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // -------------------------------------------------------------------------
    // GET /api/usuarios
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<Page<UsuarioResponse>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean incluirInactivos
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombreCompleto").ascending());
        return ResponseEntity.ok(usuarioService.listar(pageable, incluirInactivos));
    }

    // -------------------------------------------------------------------------
    // GET /api/usuarios/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.obtenerPorId(id));
    }

    // -------------------------------------------------------------------------
    // POST /api/usuarios
    // -------------------------------------------------------------------------

    @PostMapping
    public ResponseEntity<UsuarioResponse> crear(
            @RequestBody @Valid CrearUsuarioRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        UsuarioResponse response = usuarioService.crear(body, auth.getName(), ip);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // -------------------------------------------------------------------------
    // PUT /api/usuarios/{id}
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> actualizar(
            @PathVariable Long id,
            @RequestBody @Valid ActualizarUsuarioRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(usuarioService.actualizar(id, body, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // PUT /api/usuarios/{id}/toggle-activo
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/toggle-activo")
    public ResponseEntity<UsuarioResponse> toggleActivo(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(usuarioService.toggleActivo(id, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // PUT /api/usuarios/{id}/reset-password
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetearContrasena(
            @PathVariable Long id,
            @RequestBody @Valid ResetPasswordRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        usuarioService.resetearContrasena(id, body, auth.getName(), ip);
        return ResponseEntity.ok().build();
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
}
