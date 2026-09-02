package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class SolicitudPublicaResponse {

    private String codigoExpediente;
    private LocalDate fechaRecepcion;
    private LocalDate fechaLimite;
    private String estado;
    private String mensaje;
}
