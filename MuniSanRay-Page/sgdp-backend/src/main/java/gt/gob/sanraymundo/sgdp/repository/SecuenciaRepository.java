package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.SecuenciaCodigo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SecuenciaRepository extends JpaRepository<SecuenciaCodigo, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SecuenciaCodigo s WHERE s.tipo = :tipo")
    Optional<SecuenciaCodigo> findByTipoForUpdate(@Param("tipo") String tipo);
}
