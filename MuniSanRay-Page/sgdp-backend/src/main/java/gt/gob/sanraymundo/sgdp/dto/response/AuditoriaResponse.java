package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.RegistroAuditoria;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AuditoriaResponse {

    private Long id;
    private Instant timestampUtc;
    private Long usuarioId;
    private String usuarioDesc;
    private String ipOrigen;
    private String accion;
    private String objetoTipo;
    private String objetoId;
    private String objetoDesc;
    private String resultado;
    private String detalle;

    public static AuditoriaResponse from(RegistroAuditoria r) {
        return AuditoriaResponse.builder()
                .id(r.getId())
                .timestampUtc(r.getTimestampUtc())
                .usuarioId(r.getUsuario() != null ? r.getUsuario().getId() : null)
                .usuarioDesc(r.getUsuarioDesc())
                .ipOrigen(r.getIpOrigen())
                .accion(r.getAccion())
                .objetoTipo(r.getObjetoTipo())
                .objetoId(r.getObjetoId())
                .objetoDesc(r.getObjetoDesc())
                .resultado(r.getResultado())
                .detalle(r.getDetalle())
                .build();
    }
}
