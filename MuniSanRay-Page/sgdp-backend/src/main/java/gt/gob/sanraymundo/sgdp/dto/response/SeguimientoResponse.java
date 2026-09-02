package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SeguimientoResponse {

    private String codigoExpediente;
    private String nombreSolicitante;
    private LocalDate fechaRecepcion;
    private LocalDate fechaLimite;
    private String estado;
    private LocalDate fechaProrroga;
    private LocalDateTime fechaRespuesta;
}
