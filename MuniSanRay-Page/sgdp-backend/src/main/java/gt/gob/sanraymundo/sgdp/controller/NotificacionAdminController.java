package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.response.NotificacionResponse;
import gt.gob.sanraymundo.sgdp.service.NotificacionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notificaciones")
@RequiredArgsConstructor
public class NotificacionAdminController {

    private final NotificacionService notificacionService;

    @GetMapping
    public ResponseEntity<List<NotificacionResponse>> listar() {
        return ResponseEntity.ok(notificacionService.listar());
    }
}
