package gt.gob.sanraymundo.sgdp.repository;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoElectronico(String correo);

    boolean existsByCorreoElectronico(String correo);

    Optional<Usuario> findByNombreUsuario(String nombreUsuario);

    boolean existsByNombreUsuario(String nombreUsuario);

    boolean existsByDpi(String dpi);

    List<Usuario> findByRolAndActivoTrue(RolUsuario rol);

    Page<Usuario> findByActivoTrue(Pageable pageable);
}
