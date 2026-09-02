package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.CategoriaDocumento;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoriaResponse {

    private Long id;
    private String nombre;
    private String descripcion;
    private boolean esLaip;
    private boolean activa;

    public static CategoriaResponse from(CategoriaDocumento cat) {
        return CategoriaResponse.builder()
                .id(cat.getId())
                .nombre(cat.getNombre())
                .descripcion(cat.getDescripcion())
                .esLaip(Boolean.TRUE.equals(cat.getEsLaip()))
                .activa(Boolean.TRUE.equals(cat.getActiva()))
                .build();
    }
}
