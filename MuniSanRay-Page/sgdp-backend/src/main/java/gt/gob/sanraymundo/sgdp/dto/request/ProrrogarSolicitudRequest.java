package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProrrogarSolicitudRequest {

    @NotBlank
    private String motivoProrroga;
}
