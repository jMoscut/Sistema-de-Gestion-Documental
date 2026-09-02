package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.VersionDocumento;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VersionDocumentoResponse {

    private Long id;
    private Long documentoId;
    private Integer numeroVersion;
    private String hashSha256;
    private Long tamanoBytes;
    private String motivoCambio;
    private String creadoPorNombre;
    private LocalDateTime createdAt;

    public static VersionDocumentoResponse from(VersionDocumento v) {
        return VersionDocumentoResponse.builder()
                .id(v.getId())
                .documentoId(v.getDocumento().getId())
                .numeroVersion(v.getNumeroVersion())
                .hashSha256(v.getHashSha256())
                .tamanoBytes(v.getTamanoBytes())
                .motivoCambio(v.getMotivoCambio())
                .creadoPorNombre(v.getCreadoPor() != null ? v.getCreadoPor().getNombreCompleto() : null)
                .createdAt(v.getCreatedAt())
                .build();
    }
}
