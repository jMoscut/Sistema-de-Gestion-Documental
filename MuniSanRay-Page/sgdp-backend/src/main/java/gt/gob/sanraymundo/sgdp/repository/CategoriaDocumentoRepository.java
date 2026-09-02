package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.CategoriaDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaDocumentoRepository extends JpaRepository<CategoriaDocumento, Long> {

    List<CategoriaDocumento> findByActivaTrue();

    Optional<CategoriaDocumento> findByNombre(String nombre);

    boolean existsByNombre(String nombre);
}
