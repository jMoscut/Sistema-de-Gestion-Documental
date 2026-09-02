package gt.gob.sanraymundo.sgdp.model.entity;

import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import jakarta.persistence.*;
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
@Entity
@Table(name = "documentos")
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "titulo", nullable = false, length = 500)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaDocumento categoria;

    @Column(name = "unidad_origen", nullable = false, length = 150)
    private String unidadOrigen;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_acceso", nullable = false, length = 20)
    @Builder.Default
    private NivelAcceso nivelAcceso = NivelAcceso.INTERNO;

    @Column(name = "r2_key", nullable = false, length = 500)
    private String r2Key;

    @Column(name = "nombre_archivo", nullable = false, length = 300)
    private String nombreArchivo;

    @Column(name = "tamano_bytes", nullable = false)
    private Long tamanoBytes;

    @Column(name = "hash_sha256", nullable = false, length = 64)
    private String hashSha256;

    @Column(name = "version_actual", nullable = false)
    @Builder.Default
    private Integer versionActual = 1;

    @Column(name = "estado", nullable = false, length = 30)
    @Builder.Default
    private String estado = "VIGENTE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por", nullable = false)
    private Usuario registradoPor;

    // search_vector is GENERATED ALWAYS in DB — not mapped to avoid insert/update conflicts
    // It is used in native queries only

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
