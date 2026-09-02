package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.MetaCumplimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MetaCumplimientoRepository extends JpaRepository<MetaCumplimiento, Integer> {
    Optional<MetaCumplimiento> findByModulo(String modulo);
}
