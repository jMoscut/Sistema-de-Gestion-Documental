package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "registro_auditoria")
public class RegistroAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "timestamp_utc", nullable = false, updatable = false)
    private LocalDateTime timestampUtc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "usuario_desc", length = 300)
    private String usuarioDesc;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    // DB column is "accion" (not "tipo_accion")
    @Column(name = "accion", nullable = false, length = 50)
    private String accion;

    @Column(name = "objeto_tipo", length = 100)
    private String objetoTipo;

    @Column(name = "objeto_id", length = 100)
    private String objetoId;

    // DB column is "objeto_desc" (not "objeto_descripcion")
    @Column(name = "objeto_desc", length = 500)
    private String objetoDesc;

    // DB CHECK: resultado IN ('EXITO', 'FALLO', 'DENEGADO')
    @Column(name = "resultado", nullable = false, length = 20)
    @Builder.Default
    private String resultado = "EXITO";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detalle", columnDefinition = "jsonb")
    private String detalle;

    @PrePersist
    protected void onCreate() {
        if (this.timestampUtc == null) {
            this.timestampUtc = LocalDateTime.now();
        }
    }
}
