package gt.gob.sanraymundo.sgdp.dto.request;

import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SubirDocumentoRequest {

    @NotBlank
    @Size(max = 500)
    private String titulo;

    private String descripcion;

    @NotNull
    private Long categoriaId;

    @NotBlank
    @Size(max = 150)
    private String unidadOrigen;

    @NotNull
    private LocalDate fechaEmision;

    /**
     * Nivel de acceso del documento. Si es null, el servicio aplica INTERNO por defecto.
     */
    private NivelAcceso nivelAcceso;
}
