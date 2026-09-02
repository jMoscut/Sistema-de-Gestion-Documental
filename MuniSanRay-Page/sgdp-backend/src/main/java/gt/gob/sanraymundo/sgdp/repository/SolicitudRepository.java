package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitudRepository extends JpaRepository<SolicitudInformacion, Long>,
        JpaSpecificationExecutor<SolicitudInformacion> {

    Optional<SolicitudInformacion> findByCodigoExpediente(String codigoExpediente);

    Page<SolicitudInformacion> findByEstado(EstadoSolicitud estado, Pageable pageable);

    long countByEstado(EstadoSolicitud estado);

    List<SolicitudInformacion> findByEstadoIn(List<EstadoSolicitud> estados);
}
