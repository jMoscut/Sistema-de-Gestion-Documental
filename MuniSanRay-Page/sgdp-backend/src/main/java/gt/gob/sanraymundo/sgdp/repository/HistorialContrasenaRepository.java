package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.HistorialContrasena;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistorialContrasenaRepository extends JpaRepository<HistorialContrasena, Long> {

    /**
     * Obtener las últimas 3 contraseñas de un usuario para verificar reutilización.
     */
    List<HistorialContrasena> findTop3ByUsuarioOrderByCreatedAtDesc(Usuario usuario);
}
