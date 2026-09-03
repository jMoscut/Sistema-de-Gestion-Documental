package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.CambiarContrasenaRequest;
import gt.gob.sanraymundo.sgdp.dto.request.LoginRequest;
import gt.gob.sanraymundo.sgdp.dto.response.LoginResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import org.springframework.security.authentication.BadCredentialsException;
import gt.gob.sanraymundo.sgdp.model.entity.HistorialContrasena;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.HistorialContrasenaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_INTENTOS_FALLIDOS = 3;
    private static final int MINUTOS_BLOQUEO = 15;

    private final UsuarioRepository usuarioRepository;
    private final HistorialContrasenaRepository historialContrasenaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditoriaService auditoriaService;
    private final UsuarioService usuarioService;

    /**
     * Autenticar usuario y generar JWT.
     *
     * @param request credenciales de login
     * @param ipOrigen IP del cliente
     * @return LoginResponse con token JWT y datos del usuario
     */
    @Transactional
    public LoginResponse login(LoginRequest request, String ipOrigen) {
        // Find user (use BadCredentialsException so response is 401, not 400)
        String usuarioNormalizado = request.getNombreUsuario().trim().toLowerCase();
        Usuario usuario = usuarioRepository.findByNombreUsuario(usuarioNormalizado)
                .orElseThrow(() -> {
                    auditoriaService.registrarFallo(null, usuarioNormalizado, ipOrigen,
                            TipoAccion.LOGIN_FALLIDO, "Usuario no encontrado: " + usuarioNormalizado);
                    return new BadCredentialsException("Credenciales inválidas.");
                });

        // Check if account is active
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            auditoriaService.registrarFallo(usuario.getId(), usuario.getNombreUsuario(), ipOrigen,
                    TipoAccion.LOGIN_FALLIDO, "Cuenta desactivada");
            throw new NegocioException("La cuenta está desactivada. Contacte al administrador.");
        }

        // Check if account is currently locked
        if (usuario.getBloqueadoHasta() != null
                && usuario.getBloqueadoHasta().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            auditoriaService.registrarFallo(usuario.getId(), usuario.getNombreUsuario(), ipOrigen,
                    TipoAccion.LOGIN_FALLIDO, "Cuenta bloqueada hasta: " + usuario.getBloqueadoHasta());
            throw new NegocioException(
                    "Cuenta bloqueada temporalmente. Intente nuevamente después de las "
                    + aHoraGuatemala(usuario.getBloqueadoHasta()));
        }

        // Verify password
        if (!passwordEncoder.matches(request.getContrasena(), usuario.getContrasenaHash())) {
            // Persistido en transacción propia (REQUIRES_NEW): debe sobrevivir aunque
            // este método termine lanzando una excepción y haga rollback.
            Usuario actualizado = usuarioService.registrarIntentoFallido(
                    usuario.getId(), MAX_INTENTOS_FALLIDOS, MINUTOS_BLOQUEO);

            if (actualizado.getBloqueadoHasta() != null
                    && actualizado.getBloqueadoHasta().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
                auditoriaService.registrar(
                        usuario.getId(), usuario.getNombreUsuario(), ipOrigen,
                        TipoAccion.CUENTA_BLOQUEADA, "USUARIO", usuario.getId().toString(),
                        usuario.getNombreCompleto(), "EXITO",
                        Map.of("bloqueado_hasta", actualizado.getBloqueadoHasta().toString(),
                               "motivo", "Máximo de intentos fallidos alcanzado")
                );
                throw new NegocioException(
                        "Cuenta bloqueada por " + MINUTOS_BLOQUEO
                        + " minutos debido a múltiples intentos fallidos.");
            }

            auditoriaService.registrarFallo(usuario.getId(), usuario.getNombreUsuario(), ipOrigen,
                    TipoAccion.LOGIN_FALLIDO,
                    "Contraseña incorrecta (intento " + actualizado.getIntentosFallidos() + ")");
            throw new BadCredentialsException("Credenciales inválidas.");
        }

        // Successful login: reset failed attempts and update last access
        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);
        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepository.save(usuario);

        // Generate token
        String token = jwtUtil.generateToken(usuario);

        auditoriaService.registrarExito(
                usuario.getId(), usuario.getNombreUsuario(), ipOrigen,
                TipoAccion.LOGIN_EXITOSO, "USUARIO", usuario.getId().toString(),
                usuario.getNombreCompleto()
        );

        return LoginResponse.builder()
                .token(token)
                .rol(usuario.getRol().name())
                .nombre(usuario.getNombreCompleto())
                .requiereCambioContrasena(Boolean.TRUE.equals(usuario.getRequiereCambioContrasena()))
                .build();
    }

    /**
     * Convierte un LocalDateTime almacenado en UTC (bloqueadoHasta) a la hora
     * local de Guatemala (UTC-6, sin horario de verano), para mostrarla al usuario.
     */
    private String aHoraGuatemala(LocalDateTime utc) {
        return utc.atOffset(ZoneOffset.UTC)
                .atZoneSameInstant(ZoneId.of("America/Guatemala"))
                .toLocalTime()
                .withNano(0)
                .toString();
    }

    /**
     * Cambiar contraseña del usuario autenticado.
     *
     * @param nombreUsuario nombre de usuario del autenticado (del JWT)
     * @param request datos de cambio de contraseña
     * @param ipOrigen IP del cliente
     */
    @Transactional
    public void cambiarContrasena(String nombreUsuario, CambiarContrasenaRequest request, String ipOrigen) {
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", "nombreUsuario", nombreUsuario));

        // Verify current password
        if (!passwordEncoder.matches(request.getContrasenaActual(), usuario.getContrasenaHash())) {
            auditoriaService.registrarFallo(usuario.getId(), nombreUsuario, ipOrigen,
                    TipoAccion.RESET_PASSWORD, "Contraseña actual incorrecta");
            throw new NegocioException("La contraseña actual es incorrecta.");
        }

        // Check password history (last 3 passwords)
        List<HistorialContrasena> historial =
                historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(usuario);

        boolean reutilizada = historial.stream()
                .anyMatch(h -> passwordEncoder.matches(request.getContrasenaNueva(), h.getContrasenaHash()));

        if (reutilizada) {
            throw new NegocioException(
                    "La nueva contraseña no puede ser igual a las últimas 3 contraseñas utilizadas.");
        }

        // New password cannot be the same as the current one
        if (passwordEncoder.matches(request.getContrasenaNueva(), usuario.getContrasenaHash())) {
            throw new NegocioException("La nueva contraseña no puede ser igual a la contraseña actual.");
        }

        // Save current password to history before changing
        String hashActual = usuario.getContrasenaHash();
        HistorialContrasena entrada = HistorialContrasena.builder()
                .usuario(usuario)
                .contrasenaHash(hashActual)
                .build();
        historialContrasenaRepository.save(entrada);

        // Update password
        String nuevoHash = passwordEncoder.encode(request.getContrasenaNueva());
        usuario.setContrasenaHash(nuevoHash);
        usuario.setRequiereCambioContrasena(false);
        usuarioRepository.save(usuario);

        auditoriaService.registrarExito(
                usuario.getId(), nombreUsuario, ipOrigen,
                TipoAccion.RESET_PASSWORD, "USUARIO", usuario.getId().toString(),
                "Cambio de contraseña exitoso"
        );
    }

    /**
     * Registrar el logout del usuario autenticado.
     *
     * @param nombreUsuario nombre de usuario (del JWT)
     * @param ipOrigen IP del cliente
     */
    @Transactional(readOnly = true)
    public void logout(String nombreUsuario, String ipOrigen) {
        usuarioRepository.findByNombreUsuario(nombreUsuario).ifPresent(usuario ->
                auditoriaService.registrarExito(
                        usuario.getId(), nombreUsuario, ipOrigen,
                        TipoAccion.LOGOUT, "USUARIO", usuario.getId().toString(),
                        "Logout exitoso"
                )
        );
    }
}
