package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OficioBusquedaResultado {
    private String tipo; // "CARPETA" | "DOCUMENTO"
    private Integer categoriaNumero;
    private Long categoriaId;
    private String categoriaNombre;
    private Long carpetaId;
    private String carpetaNombre;
    private Long documentoId;       // null for CARPETA hits
    private String documentoTitulo; // null for CARPETA hits
    private String documentoArchivoNombre; // null for CARPETA hits
}
