package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificacionResponse {
    private String tipo; // SOLICITUD_POR_VENCER | SOLICITUD_VENCIDA | OFICIO_DESACTUALIZADO
    private String titulo;
    private String mensaje;
    private Long referenciaId;
    private String codigoExpediente;
    private Integer diasRestantes;
}
