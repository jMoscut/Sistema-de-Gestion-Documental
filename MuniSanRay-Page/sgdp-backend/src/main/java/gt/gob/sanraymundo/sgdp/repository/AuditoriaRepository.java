package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.RegistroAuditoria;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface AuditoriaRepository extends JpaRepository<RegistroAuditoria, Long> {

    Page<RegistroAuditoria> findByOrderByTimestampUtcDesc(Pageable pageable);

    Page<RegistroAuditoria> findByUsuarioIdOrderByTimestampUtcDesc(Long usuarioId, Pageable pageable);

    Page<RegistroAuditoria> findByAccionOrderByTimestampUtcDesc(String accion, Pageable pageable);

    Page<RegistroAuditoria> findByTimestampUtcBetweenOrderByTimestampUtcDesc(
            LocalDateTime desde,
            LocalDateTime hasta,
            Pageable pageable
    );
}
