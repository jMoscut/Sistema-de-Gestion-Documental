package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Búsqueda por substring (letras, números, cualquier fragmento) en lugar de
 * full-text tokenizado, para que "presu" encuentre "Presupuesto" y "2024"
 * encuentre "DOC-2024-001". Multi-palabra: cada palabra debe aparecer en
 * alguno de los campos (AND entre palabras, OR entre campos).
 */
public final class DocumentoSpecifications {

    private DocumentoSpecifications() {}

    public static Specification<Documento> texto(String q) {
        String[] palabras = q.trim().toLowerCase().split("\\s+");
        return (root, query, cb) -> {
            List<Predicate> porPalabra = new ArrayList<>();
            for (String palabra : palabras) {
                if (palabra.isBlank()) continue;
                String like = "%" + palabra + "%";
                porPalabra.add(cb.or(
                        cb.like(cb.lower(root.get("titulo")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("descripcion"), "")), like),
                        cb.like(cb.lower(root.get("codigo")), like),
                        cb.like(cb.lower(root.get("nombreArchivo")), like),
                        cb.like(cb.lower(root.get("unidadOrigen")), like)
                ));
            }
            return cb.and(porPalabra.toArray(new Predicate[0]));
        };
    }

    public static Specification<Documento> nivelAcceso(String nivelAccesoStr) {
        if (nivelAccesoStr == null || nivelAccesoStr.isBlank()) return null;
        NivelAcceso nivel = NivelAcceso.valueOf(nivelAccesoStr.toUpperCase());
        return (root, query, cb) -> cb.equal(root.get("nivelAcceso"), nivel);
    }

    public static Specification<Documento> estado(String estado) {
        if (estado == null || estado.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("estado"), estado);
    }

    public static Specification<Documento> categoriaId(Long categoriaId) {
        if (categoriaId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("categoria").get("id"), categoriaId);
    }

    public static Specification<Documento> and(Specification<Documento>... specs) {
        Specification<Documento> result = Specification.where(null);
        for (Specification<Documento> spec : specs) {
            if (spec != null) result = result.and(spec);
        }
        return result;
    }
}
