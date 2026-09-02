package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CambiarContrasenaRequest {

    @NotBlank(message = "La contraseña actual es requerida")
    private String contrasenaActual;

    @NotBlank(message = "La nueva contraseña es requerida")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&._\\-])[A-Za-z\\d@$!%*?&._\\-]{8,}$",
        message = "La contraseña debe contener mayúsculas, minúsculas, números y al menos un carácter especial"
    )
    private String contrasenaNueva;
}
