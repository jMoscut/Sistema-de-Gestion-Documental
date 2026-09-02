package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.VersionDocumento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VersionDocumentoRepository extends JpaRepository<VersionDocumento, Long> {

    List<VersionDocumento> findByDocumentoIdOrderByNumeroVersionDesc(Long documentoId);
}
