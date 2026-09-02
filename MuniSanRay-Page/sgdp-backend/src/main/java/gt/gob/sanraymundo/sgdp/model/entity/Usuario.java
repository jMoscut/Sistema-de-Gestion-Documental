package gt.gob.sanraymundo.sgdp.model.entity;

import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
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
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_completo", nullable = false, length = 200)
    private String nombreCompleto;

    @Column(name = "dpi", length = 15, unique = true)
    private String dpi;

    @Column(name = "nombre_usuario", nullable = false, unique = true, length = 50)
    private String nombreUsuario;

    @Column(name = "correo_electronico", unique = true, length = 200)
    private String correoElectronico;

    @Column(name = "contrasena_hash", nullable = false, length = 255)
    private String contrasenaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 30)
    private RolUsuario rol;

    @Column(name = "unidad_municipal", length = 150)
    private String unidadMunicipal;

    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @Column(name = "requiere_cambio_contrasena", nullable = false)
    @Builder.Default
    private Boolean requiereCambioContrasena = false;

    @Column(name = "intentos_fallidos", nullable = false)
    @Builder.Default
    private Integer intentosFallidos = 0;

    @Column(name = "bloqueado_hasta")
    private LocalDateTime bloqueadoHasta;

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

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
