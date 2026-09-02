package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentoOficioResponse {
    private Long id;
    private Long carpetaId;
    private String titulo;
    private String descripcion;
    private String archivoNombre;
    private Long tamanoBytes;
    private String subidoPorNombre;
    private LocalDateTime createdAt;
}
