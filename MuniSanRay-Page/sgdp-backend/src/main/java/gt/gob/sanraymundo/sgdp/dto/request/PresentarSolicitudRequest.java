package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PresentarSolicitudRequest {

    @NotBlank
    @Size(max = 200)
    private String nombreSolicitante;

    @NotBlank(message = "El DPI es obligatorio")
    @Pattern(regexp = "\\d{13}", message = "El DPI debe tener exactamente 13 dígitos")
    private String dpiSolicitante;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "Correo electrónico inválido")
    @Size(max = 200)
    private String correoSolicitante;

    @Size(max = 20)
    private String telefonoSolicitante;

    @NotBlank
    @Size(min = 20, max = 2000)
    private String descripcionSolicitud;
}
