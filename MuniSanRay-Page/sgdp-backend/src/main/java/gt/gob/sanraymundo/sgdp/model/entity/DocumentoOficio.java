package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "documento_oficio")
public class DocumentoOficio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "carpeta_id", nullable = false)
    private CarpetaOficio carpeta;

    @Column(name = "titulo", nullable = false, length = 300)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "archivo_r2_key", nullable = false, length = 500)
    private String archivoR2Key;

    @Column(name = "archivo_nombre", nullable = false, length = 300)
    private String archivoNombre;

    @Column(name = "tamano_bytes")
    private Long tamanoBytes;

    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subido_por")
    private Usuario subidoPor;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
