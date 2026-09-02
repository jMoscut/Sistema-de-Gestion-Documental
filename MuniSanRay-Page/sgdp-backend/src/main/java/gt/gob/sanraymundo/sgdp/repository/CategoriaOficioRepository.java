package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.CategoriaOficio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaOficioRepository extends JpaRepository<CategoriaOficio, Integer> {
    List<CategoriaOficio> findBySeccionOrderByNumeroAsc(String seccion);

    @Query("SELECT COALESCE(MAX(c.numero), 0) FROM CategoriaOficio c WHERE c.seccion = :seccion")
    Short findMaxNumeroBySeccion(@Param("seccion") String seccion);
}
