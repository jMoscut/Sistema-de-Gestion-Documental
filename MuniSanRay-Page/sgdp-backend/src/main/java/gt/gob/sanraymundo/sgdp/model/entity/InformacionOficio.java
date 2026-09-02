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
@Table(name = "informacion_oficio")
public class InformacionOficio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "categoria_laip", nullable = false, length = 200)
    private String categoriaLaip;

    @Column(name = "titulo", nullable = false, length = 500)
    private String titulo;

    @Column(name = "contenido", nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(name = "periodo", length = 50)
    private String periodo;

    @Column(name = "es_version_actual", nullable = false)
    @Builder.Default
    private Boolean esVersionActual = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicado_por", nullable = false)
    private Usuario publicadoPor;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @Column(name = "archivo_r2_key", length = 500)
    private String archivoR2Key;

    @Column(name = "archivo_nombre", length = 300)
    private String archivoNombre;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
