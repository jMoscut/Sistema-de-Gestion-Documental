package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoResponse {

    private Long id;
    private String codigo;
    private String titulo;
    private String descripcion;
    private CategoriaResponse categoria;
    private String unidadOrigen;
    private LocalDate fechaEmision;
    private String nivelAcceso;
    private String nombreArchivo;
    private Long tamanoBytes;
    private String hashSha256;
    private Integer versionActual;
    private String estado;
    private String registradoPorNombre;
    private LocalDateTime createdAt;

    public static DocumentoResponse from(Documento doc) {
        return DocumentoResponse.builder()
                .id(doc.getId())
                .codigo(doc.getCodigo())
                .titulo(doc.getTitulo())
                .descripcion(doc.getDescripcion())
                .categoria(doc.getCategoria() != null ? CategoriaResponse.from(doc.getCategoria()) : null)
                .unidadOrigen(doc.getUnidadOrigen())
                .fechaEmision(doc.getFechaEmision())
                .nivelAcceso(doc.getNivelAcceso() != null ? doc.getNivelAcceso().name() : null)
                .nombreArchivo(doc.getNombreArchivo())
                .tamanoBytes(doc.getTamanoBytes())
                .hashSha256(doc.getHashSha256())
                .versionActual(doc.getVersionActual())
                .estado(doc.getEstado())
                .registradoPorNombre(doc.getRegistradoPor() != null ? doc.getRegistradoPor().getNombreCompleto() : null)
                .createdAt(doc.getCreatedAt())
                .build();
    }
}
