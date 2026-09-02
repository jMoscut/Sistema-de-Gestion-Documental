package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CrearCategoriaDocumentoRequest {

    @NotBlank
    @Size(max = 150)
    private String nombre;

    @Size(max = 500)
    private String descripcion;
}
