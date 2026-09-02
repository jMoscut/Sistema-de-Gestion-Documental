package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CarpetaOficioRepository extends JpaRepository<CarpetaOficio, Long> {
    List<CarpetaOficio> findByCategoriaIdOrderByCreatedAtDesc(Integer categoriaId);
    long countByCategoriaId(Integer categoriaId);

    @Query("SELECT COUNT(DISTINCT c.categoria.id) FROM CarpetaOficio c WHERE c.categoria.seccion = :seccion")
    long countCategoriasConContenidoEnSeccion(@Param("seccion") String seccion);

    @Query("""
            SELECT c FROM CarpetaOficio c
            JOIN FETCH c.categoria cat
            WHERE cat.seccion = :seccion
              AND (LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(c.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY cat.numero ASC, c.nombre ASC
            """)
    List<CarpetaOficio> buscarPorTexto(@Param("q") String q, @Param("seccion") String seccion);

    @Query("""
            SELECT c FROM CarpetaOficio c
            JOIN FETCH c.categoria cat
            WHERE NOT EXISTS (
                SELECT d FROM DocumentoOficio d
                WHERE d.carpeta = c AND d.createdAt >= :threshold
            )
            ORDER BY cat.seccion ASC, cat.numero ASC, c.nombre ASC
            """)
    List<CarpetaOficio> findCarpetasDesactualizadas(@Param("threshold") LocalDateTime threshold);
}
