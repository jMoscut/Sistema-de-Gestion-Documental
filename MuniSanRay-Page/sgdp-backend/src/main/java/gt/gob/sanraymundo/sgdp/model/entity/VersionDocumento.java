package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "versiones_documento",
       uniqueConstraints = @UniqueConstraint(columnNames = {"documento_id", "numero_version"}))
public class VersionDocumento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_id", nullable = false)
    private Documento documento;

    @Column(name = "numero_version", nullable = false)
    private Integer numeroVersion;

    @Column(name = "r2_key", nullable = false, length = 500)
    private String r2Key;

    @Column(name = "hash_sha256", nullable = false, length = 64)
    private String hashSha256;

    @Column(name = "tamano_bytes", nullable = false)
    private Long tamanoBytes;

    @Column(name = "motivo_cambio", columnDefinition = "TEXT")
    private String motivoCambio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por", nullable = false)
    private Usuario creadoPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
