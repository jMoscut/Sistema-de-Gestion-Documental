package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "El nombre de usuario es requerido")
    private String nombreUsuario;

    @NotBlank(message = "La contraseña es requerida")
    private String contrasena;
}
