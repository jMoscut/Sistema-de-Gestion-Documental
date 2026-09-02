package gt.gob.sanraymundo.sgdp.security;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String nombreUsuario) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> {
                    log.warn("Usuario no encontrado: {}", nombreUsuario);
                    return new UsernameNotFoundException(
                            "Usuario no encontrado: " + nombreUsuario);
                });

        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            log.warn("Intento de acceso por usuario inactivo: {}", nombreUsuario);
            throw new UsernameNotFoundException("Cuenta desactivada: " + nombreUsuario);
        }

        String roleAuthority = "ROLE_" + usuario.getRol().name();

        return User.builder()
                .username(usuario.getNombreUsuario())
                .password(usuario.getContrasenaHash())
                .authorities(List.of(new SimpleGrantedAuthority(roleAuthority)))
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!Boolean.TRUE.equals(usuario.getActivo()))
                .build();
    }
}
