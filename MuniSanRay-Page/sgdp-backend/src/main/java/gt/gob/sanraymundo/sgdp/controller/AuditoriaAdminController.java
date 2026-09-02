package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.response.AuditoriaResponse;
import gt.gob.sanraymundo.sgdp.service.AuditoriaAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

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
        LocalDateTime desdeDateTime = (desde != null && !desde.isBlank())
                ? LocalDateTime.parse(desde)
                : null;
        LocalDateTime hastaDateTime = (hasta != null && !hasta.isBlank())
                ? LocalDateTime.parse(hasta)
                : null;

        Pageable pageable = PageRequest.of(page, size);

        Page<AuditoriaResponse> resultado = auditoriaAdminService.listar(
                accion, usuarioId, desdeDateTime, hastaDateTime, pageable);

        return ResponseEntity.ok(resultado);
    }
}
