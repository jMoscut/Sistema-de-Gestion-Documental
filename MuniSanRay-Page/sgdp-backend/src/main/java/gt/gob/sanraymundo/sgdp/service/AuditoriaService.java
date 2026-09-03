package gt.gob.sanraymundo.sgdp.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import gt.gob.sanraymundo.sgdp.model.entity.RegistroAuditoria;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.AuditoriaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(
            Long usuarioId,
            String usuarioDesc,
            String ipOrigen,
            TipoAccion accion,
            String objetoTipo,
            String objetoId,
            String objetoDesc,
            String resultado,
            Map<String, Object> detalle
    ) {
        Usuario usuario = null;
        if (usuarioId != null) {
            usuario = usuarioRepository.findById(usuarioId).orElse(null);
        }

        String detalleJson = null;
        if (detalle != null && !detalle.isEmpty()) {
            try {
                detalleJson = objectMapper.writeValueAsString(detalle);
            } catch (JsonProcessingException e) {
                log.warn("No se pudo serializar el detalle de auditoría: {}", e.getMessage());
                detalleJson = "{\"error\": \"serialization_failed\"}";
            }
        }

        RegistroAuditoria registro = RegistroAuditoria.builder()
                .timestampUtc(Instant.now())
                .usuario(usuario)
                .usuarioDesc(usuarioDesc)
                .ipOrigen(ipOrigen)
                .accion(accion.name())
                .objetoTipo(objetoTipo)
                .objetoId(objetoId)
                .objetoDesc(objetoDesc)
                .resultado(resultado != null ? resultado : "EXITO")
                .detalle(detalleJson)
                .build();

        auditoriaRepository.save(registro);
    }

    // Valores válidos en BD CHECK: 'EXITO', 'FALLO', 'DENEGADO'

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarExito(
            Long usuarioId,
            String usuarioDesc,
            String ipOrigen,
            TipoAccion accion,
            String objetoTipo,
            String objetoId,
            String objetoDesc
    ) {
        try {
            registrar(usuarioId, usuarioDesc, ipOrigen, accion, objetoTipo, objetoId, objetoDesc, "EXITO", null);
        } catch (Exception e) {
            log.error("Error auditoría EXITO [{}]: {}", accion, e.getMessage(), e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarFallo(
            Long usuarioId,
            String usuarioDesc,
            String ipOrigen,
            TipoAccion accion,
            String mensaje
    ) {
        try {
            registrar(usuarioId, usuarioDesc, ipOrigen, accion, null, null, mensaje, "FALLO", null);
        } catch (Exception e) {
            log.error("Error auditoría FALLO [{}]: {}", accion, e.getMessage(), e);
        }
    }
}
