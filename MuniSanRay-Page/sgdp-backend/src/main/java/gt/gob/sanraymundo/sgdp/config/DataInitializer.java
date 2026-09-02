package gt.gob.sanraymundo.sgdp.config;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@sanraymundo.gob.gt";
    private static final String ADMIN_PASSWORD = "Admin123";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        usuarioRepository.findByNombreUsuario(ADMIN_USERNAME).ifPresentOrElse(
            admin -> { /* admin ya existe: no tocar su contraseña */ },
            () -> {
                Usuario admin = new Usuario();
                admin.setNombreCompleto("Administrador del Sistema");
                admin.setNombreUsuario(ADMIN_USERNAME);
                admin.setCorreoElectronico(ADMIN_EMAIL);
                admin.setContrasenaHash(passwordEncoder.encode(ADMIN_PASSWORD));
                admin.setRol(RolUsuario.ADMINISTRADOR);
                admin.setUnidadMunicipal("Informática");
                admin.setActivo(true);
                admin.setRequiereCambioContrasena(true);
                admin.setIntentosFallidos(0);
                usuarioRepository.save(admin);
                log.info("Admin user created");
            }
        );
    }
}
