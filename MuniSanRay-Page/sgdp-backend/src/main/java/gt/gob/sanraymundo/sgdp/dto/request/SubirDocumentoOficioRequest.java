package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubirDocumentoOficioRequest {
    @NotBlank(message = "El título es obligatorio")
    @Size(max = 300)
    private String titulo;

    @Size(max = 1000)
    private String descripcion;
}
