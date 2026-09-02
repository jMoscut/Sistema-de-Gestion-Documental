package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.AsignarOficialRequest;
import gt.gob.sanraymundo.sgdp.dto.request.DenegarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ProrrogarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResponderSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.response.OficialResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudAdminResponse;
import gt.gob.sanraymundo.sgdp.service.SolicitudService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
@RequiredArgsConstructor
public class SolicitudAdminController {

    private final SolicitudService solicitudService;

    // -------------------------------------------------------------------------
    // GET /api/solicitudes
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<Page<SolicitudAdminResponse>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaLimite").ascending());
        return ResponseEntity.ok(solicitudService.listar(estado, q, pageable));
    }

    // -------------------------------------------------------------------------
    // GET /api/solicitudes/oficiales
    // -------------------------------------------------------------------------

    @GetMapping("/oficiales")
    public ResponseEntity<List<OficialResponse>> listarOficiales() {
        return ResponseEntity.ok(solicitudService.listarOficiales());
    }

    // -------------------------------------------------------------------------
    // GET /api/solicitudes/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<SolicitudAdminResponse> obtenerDetalle(@PathVariable Long id) {
        return ResponseEntity.ok(solicitudService.obtenerDetalle(id));
    }

    // -------------------------------------------------------------------------
    // PUT /api/solicitudes/{id}/asignar
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/asignar")
    public ResponseEntity<SolicitudAdminResponse> asignarOficial(
            @PathVariable Long id,
            @RequestBody @Valid AsignarOficialRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(
                solicitudService.asignarOficial(id, body.getOficialId(), auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // PUT /api/solicitudes/{id}/prorrogar
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/prorrogar")
    public ResponseEntity<SolicitudAdminResponse> prorrogar(
            @PathVariable Long id,
            @RequestBody @Valid ProrrogarSolicitudRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(
                solicitudService.prorrogar(id, body, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // PUT /api/solicitudes/{id}/responder
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/responder")
    public ResponseEntity<SolicitudAdminResponse> responder(
            @PathVariable Long id,
            @RequestBody @Valid ResponderSolicitudRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(
                solicitudService.responder(id, body, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // PUT /api/solicitudes/{id}/denegar
    // -------------------------------------------------------------------------

    @PutMapping("/{id}/denegar")
    public ResponseEntity<SolicitudAdminResponse> denegar(
            @PathVariable Long id,
            @RequestBody @Valid DenegarSolicitudRequest body,
            Authentication auth,
            @RequestHeader(value = "X-Forwarded-For", required = false) String xForwardedFor,
            HttpServletRequest request
    ) {
        String ip = extractIp(xForwardedFor, request);
        return ResponseEntity.ok(
                solicitudService.denegar(id, body, auth.getName(), ip));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Extrae la IP de origen: primero el header X-Forwarded-For (primer valor),
     * si no está presente usa la IP directa de la conexión.
     */
    private String extractIp(String xForwardedFor, HttpServletRequest req) {
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }
}
