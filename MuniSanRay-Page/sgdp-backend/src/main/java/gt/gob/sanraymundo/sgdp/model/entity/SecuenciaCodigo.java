package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "secuencias_codigo")
public class SecuenciaCodigo {

    @Id
    @Column(name = "tipo", length = 50)
    private String tipo;

    @Column(name = "prefijo", nullable = false, length = 10)
    private String prefijo;

    @Column(name = "ultimo_num", nullable = false)
    private Integer ultimoNum;

    @Column(name = "anio", nullable = false)
    private Integer anio;
}
