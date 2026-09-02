package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AsignarOficialRequest {

    @NotNull
    private Long oficialId;
}
