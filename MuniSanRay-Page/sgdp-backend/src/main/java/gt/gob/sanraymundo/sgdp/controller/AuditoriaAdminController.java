package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.response.AuditoriaResponse;
import gt.gob.sanraymundo.sgdp.service.AuditoriaAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/admin/auditoria")
@RequiredArgsConstructor
public class AuditoriaAdminController {

    private final AuditoriaAdminService auditoriaAdminService;

    // -------------------------------------------------------------------------
    // GET /api/admin/auditoria
    // -------------------------------------------------------------------------

    @GetMapping
    public ResponseEntity<Page<AuditoriaResponse>> listar(
            @RequestParam(required = false) String accion,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        // Los filtros de fecha vienen del <input type="datetime-local"> del admin,
        // es decir, hora local de Guatemala (sin offset) — se interpretan como tal
        // y se convierten al instante UTC real antes de comparar contra la BD.
        ZoneId zonaGuatemala = ZoneId.of("America/Guatemala");
        Instant desdeInstant = (desde != null && !desde.isBlank())
                ? LocalDateTime.parse(desde).atZone(zonaGuatemala).toInstant()
                : null;
        Instant hastaInstant = (hasta != null && !hasta.isBlank())
                ? LocalDateTime.parse(hasta).atZone(zonaGuatemala).toInstant()
                : null;

        Pageable pageable = PageRequest.of(page, size);

        Page<AuditoriaResponse> resultado = auditoriaAdminService.listar(
                accion, usuarioId, desdeInstant, hastaInstant, pageable);

        return ResponseEntity.ok(resultado);
    }
}
