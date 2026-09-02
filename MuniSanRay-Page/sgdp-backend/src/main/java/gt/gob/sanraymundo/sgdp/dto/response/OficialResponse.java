package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OficialResponse {

    private Long id;
    private String nombreCompleto;
    private String correoElectronico;
    private String unidadMunicipal;

    public static OficialResponse from(Usuario u) {
        return OficialResponse.builder()
                .id(u.getId())
                .nombreCompleto(u.getNombreCompleto())
                .correoElectronico(u.getCorreoElectronico())
                .unidadMunicipal(u.getUnidadMunicipal())
                .build();
    }
}
