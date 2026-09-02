package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.CategoriaDocumento;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentoRepository extends JpaRepository<Documento, Long>, JpaSpecificationExecutor<Documento> {

    Page<Documento> findByNivelAcceso(NivelAcceso nivelAcceso, Pageable pageable);

    Page<Documento> findByEstado(String estado, Pageable pageable);

    Page<Documento> findByNivelAccesoAndEstado(NivelAcceso nivelAcceso, String estado, Pageable pageable);

    /**
     * Verificar si existe un documento con el mismo hash (integridad / duplicado).
     */
    boolean existsByHashSha256(String hashSha256);

    boolean existsByCategoria(CategoriaDocumento categoria);

    @Query(value = """
            SELECT d.* FROM documentos d
            WHERE d.nivel_acceso = 'PUBLICO'
              AND d.estado = 'VIGENTE'
              AND (:categoriaId IS NULL OR d.categoria_id = :categoriaId)
            ORDER BY d.created_at DESC
            """,
           countQuery = """
            SELECT COUNT(*) FROM documentos d
            WHERE d.nivel_acceso = 'PUBLICO'
              AND d.estado = 'VIGENTE'
              AND (:categoriaId IS NULL OR d.categoria_id = :categoriaId)
            """,
           nativeQuery = true)
    Page<Documento> buscarPublicos(@Param("categoriaId") Long categoriaId, Pageable pageable);
}
