package gt.gob.sanraymundo.sgdp.dto.request;

import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActualizarUsuarioRequest {

    @NotBlank
    @Size(max = 200)
    private String nombreCompleto;

    @NotBlank
    @Pattern(
            regexp = "^[A-Za-z][A-Za-z0-9_.\\-]{3,49}$",
            message = "El nombre de usuario debe iniciar con letra, tener mínimo 4 caracteres "
                    + "y solo puede contener letras, números, '.', '_' y '-'"
    )
    private String nombreUsuario;

    @Email
    @Size(max = 200)
    private String correoElectronico;

    @NotNull
    private RolUsuario rol;

    @Size(max = 150)
    private String unidadMunicipal;
}
