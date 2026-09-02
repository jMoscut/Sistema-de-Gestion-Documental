package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CrearCategoriaOficioRequest {

    @NotBlank
    @Size(max = 50)
    private String seccion;

    @NotBlank
    @Size(max = 200)
    private String nombre;
}
