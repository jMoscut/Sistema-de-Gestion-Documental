package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class ResponderSolicitudRequest {

    @NotBlank
    private String respuesta;

    private List<Long> documentoAdjuntoIds;

    /** IDs de documentos del módulo Información de Oficio (LAIP) — todos públicos por naturaleza. */
    private List<Long> documentoOficioAdjuntoIds;
}
