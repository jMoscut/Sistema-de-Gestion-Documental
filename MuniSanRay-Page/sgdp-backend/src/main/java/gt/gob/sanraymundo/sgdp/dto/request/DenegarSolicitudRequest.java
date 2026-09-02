package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DenegarSolicitudRequest {

    @NotBlank
    private String causalDenegacion;
}
