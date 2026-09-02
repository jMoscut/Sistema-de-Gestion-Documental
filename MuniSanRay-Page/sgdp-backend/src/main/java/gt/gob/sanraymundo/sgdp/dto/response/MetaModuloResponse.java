package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MetaModuloResponse {
    private String modulo;
    private String etiqueta;
    private String tipoMetrica;
    private int actual;
    private int meta;
    private int porcentaje;
}
