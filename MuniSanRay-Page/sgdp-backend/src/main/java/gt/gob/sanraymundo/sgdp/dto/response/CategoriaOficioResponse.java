package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoriaOficioResponse {
    private Integer id;
    private String seccion;
    private Short numero;
    private String nombre;
    private long totalCarpetas;
}
