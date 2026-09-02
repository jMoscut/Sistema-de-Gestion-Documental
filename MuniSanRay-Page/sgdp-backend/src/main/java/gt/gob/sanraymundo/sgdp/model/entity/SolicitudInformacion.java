package gt.gob.sanraymundo.sgdp.model.entity;

import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
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
@Table(name = "solicitudes_informacion")
public class SolicitudInformacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_expediente", nullable = false, unique = true, length = 50)
    private String codigoExpediente;

    @Column(name = "nombre_solicitante", nullable = false, length = 200)
    private String nombreSolicitante;

    @Column(name = "dpi_solicitante", length = 15)
    private String dpiSolicitante;

    @Column(name = "correo_solicitante", length = 200)
    private String correoSolicitante;

    @Column(name = "telefono_solicitante", length = 20)
    private String telefonoSolicitante;

    @Column(name = "descripcion_solicitud", nullable = false, columnDefinition = "TEXT")
    private String descripcionSolicitud;

    @Column(name = "fecha_recepcion", nullable = false)
    @Builder.Default
    private LocalDate fechaRecepcion = LocalDate.now();

    @Column(name = "fecha_limite", nullable = false)
    private LocalDate fechaLimite;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "oficial_asignado")
    private Usuario oficialAsignado;

    @Column(name = "fecha_prorroga")
    private LocalDate fechaProrroga;

    @Column(name = "motivo_prorroga", columnDefinition = "TEXT")
    private String motivoProrroga;

    @Column(name = "respuesta", columnDefinition = "TEXT")
    private String respuesta;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    @Column(name = "causal_denegacion", columnDefinition = "TEXT")
    private String causalDenegacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_respuesta_id")
    private Documento documentoRespuesta;

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
