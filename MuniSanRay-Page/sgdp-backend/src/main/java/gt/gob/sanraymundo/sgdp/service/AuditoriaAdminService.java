package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.response.AuditoriaResponse;
import gt.gob.sanraymundo.sgdp.repository.AuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditoriaAdminService {

    private final AuditoriaRepository auditoriaRepository;

    /**
     * Lista registros de auditoría con filtros opcionales.
     * Prioridad: accion > usuarioId > rango de fechas > sin filtro.
     */
    public Page<AuditoriaResponse> listar(
            String accion,
            Long usuarioId,
            LocalDateTime desde,
            LocalDateTime hasta,
            Pageable pageable
    ) {
        if (accion != null && !accion.isBlank()) {
            return auditoriaRepository
                    .findByAccionOrderByTimestampUtcDesc(accion, pageable)
                    .map(AuditoriaResponse::from);
        }
        if (usuarioId != null) {
            return auditoriaRepository
                    .findByUsuarioIdOrderByTimestampUtcDesc(usuarioId, pageable)
                    .map(AuditoriaResponse::from);
        }
        if (desde != null && hasta != null) {
            return auditoriaRepository
                    .findByTimestampUtcBetweenOrderByTimestampUtcDesc(desde, hasta, pageable)
                    .map(AuditoriaResponse::from);
        }
        return auditoriaRepository
                .findByOrderByTimestampUtcDesc(pageable)
                .map(AuditoriaResponse::from);
    }
}
