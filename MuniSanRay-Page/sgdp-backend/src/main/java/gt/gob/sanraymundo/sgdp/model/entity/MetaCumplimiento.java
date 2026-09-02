package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "metas_cumplimiento")
public class MetaCumplimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 60)
    private String modulo;

    @Column(nullable = false, length = 120)
    private String etiqueta;

    @Column(name = "tipo_metrica", nullable = false, length = 40)
    private String tipoMetrica;

    @Column(length = 50)
    private String seccion;

    @Column(name = "meta_valor", nullable = false)
    private Integer metaValor;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
