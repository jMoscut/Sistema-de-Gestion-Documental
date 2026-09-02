package gt.gob.sanraymundo.sgdp.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "categoria_oficio")
public class CategoriaOficio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "seccion", nullable = false, length = 50)
    private String seccion;

    @Column(name = "numero", nullable = false)
    private Short numero;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;
}
