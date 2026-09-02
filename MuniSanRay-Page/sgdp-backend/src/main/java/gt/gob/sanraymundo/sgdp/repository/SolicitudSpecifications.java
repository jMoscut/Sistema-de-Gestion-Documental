package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class SolicitudSpecifications {
    private static final List<EstadoSolicitud> ESTADOS_TERMINALES =
            List.of(EstadoSolicitud.RESPONDIDA, EstadoSolicitud.DENEGADA, EstadoSolicitud.VENCIDA);

    private static final List<EstadoSolicitud> ESTADOS_ACTIVOS =
            List.of(EstadoSolicitud.PENDIENTE, EstadoSolicitud.EN_PROCESO, EstadoSolicitud.PRORROGADA);

    private SolicitudSpecifications() {}

    public static Specification<SolicitudInformacion> texto(String q) {
        if (q == null || q.isBlank()) return null;
        String[] palabras = q.trim().toLowerCase().split("\\s+");
        return (root, query, cb) -> {
            List<Predicate> porPalabra = new ArrayList<>();
            for (String palabra : palabras) {
                if (palabra.isBlank()) continue;
                String like = "%" + palabra + "%";
                porPalabra.add(cb.or(
                        cb.like(cb.lower(root.get("codigoExpediente")), like),
                        cb.like(cb.lower(root.get("nombreSolicitante")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("dpiSolicitante"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("correoSolicitante"), "")), like),
                        cb.like(cb.lower(root.get("descripcionSolicitud")), like)
                ));
            }
            return cb.and(porPalabra.toArray(new Predicate[0]));
        };
    }

    public static Specification<SolicitudInformacion> estado(String estadoStr, LocalDate hoy) {
        if (estadoStr == null || estadoStr.isBlank()) return null;
        EstadoSolicitud estado = EstadoSolicitud.valueOf(estadoStr.toUpperCase());

        if (estado == EstadoSolicitud.VENCIDA) {
            return (root, query, cb) -> cb.or(
                    cb.equal(root.get("estado"), EstadoSolicitud.VENCIDA),
                    cb.and(
                            cb.lessThanOrEqualTo(root.get("fechaLimite"), hoy),
                            cb.not(root.get("estado").in(ESTADOS_TERMINALES))
                    )
            );
        }
        if (ESTADOS_ACTIVOS.contains(estado)) {
            return (root, query, cb) -> cb.and(
                    cb.equal(root.get("estado"), estado),
                    cb.greaterThan(root.get("fechaLimite"), hoy)
            );
        }
        return (root, query, cb) -> cb.equal(root.get("estado"), estado);
    }

    @SafeVarargs
    public static Specification<SolicitudInformacion> and(Specification<SolicitudInformacion>... specs) {
        Specification<SolicitudInformacion> result = Specification.where(null);
        for (Specification<SolicitudInformacion> spec : specs) {
            if (spec != null) result = result.and(spec);
        }
        return result;
    }
}
