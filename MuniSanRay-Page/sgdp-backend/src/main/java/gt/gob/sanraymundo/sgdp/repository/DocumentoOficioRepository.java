package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentoOficioRepository extends JpaRepository<DocumentoOficio, Long> {
    List<DocumentoOficio> findByCarpetaIdOrderByCreatedAtDesc(Long carpetaId);
    List<DocumentoOficio> findAllByOrderByTituloAsc();
    long countByCarpetaId(Long carpetaId);
    boolean existsByHashSha256(String hashSha256);

    @Query("""
            SELECT d FROM DocumentoOficio d
            JOIN FETCH d.carpeta c
            JOIN FETCH c.categoria cat
            WHERE cat.seccion = :seccion
              AND (LOWER(d.titulo) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(d.descripcion, '')) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(d.archivoNombre) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY cat.numero ASC, c.nombre ASC, d.titulo ASC
            """)
    List<DocumentoOficio> buscarPorTexto(@Param("q") String q, @Param("seccion") String seccion, Pageable pageable);
}
