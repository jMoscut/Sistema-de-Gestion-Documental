package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ActualizarMetaRequest {
    @Min(value = 1, message = "La meta debe ser mayor a cero")
    private int metaValor;
}
