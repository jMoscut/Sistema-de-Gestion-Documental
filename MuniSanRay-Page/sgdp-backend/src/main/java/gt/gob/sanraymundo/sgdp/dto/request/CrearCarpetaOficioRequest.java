package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CrearCarpetaOficioRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200)
    private String nombre;

    @Size(max = 1000)
    private String descripcion;
}
