package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensajeResponse {

    private String mensaje;

    public static MensajeResponse of(String mensaje) {
        return new MensajeResponse(mensaje);
    }
}
