package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CarpetaOficioResponse {
    private Long id;
    private Integer categoriaId;
    private String categoriaNombre;
    private String nombre;
    private String descripcion;
    private long totalDocumentos;
    private String creadoPorNombre;
    private LocalDateTime createdAt;
}
