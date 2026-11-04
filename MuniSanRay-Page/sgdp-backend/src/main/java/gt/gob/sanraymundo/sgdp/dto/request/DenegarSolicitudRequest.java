package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DenegarSolicitudRequest {

    @NotBlank
    @Size(min = 10, message = "La causal de denegación debe tener al menos 10 caracteres")
    private String causalDenegacion;
}
