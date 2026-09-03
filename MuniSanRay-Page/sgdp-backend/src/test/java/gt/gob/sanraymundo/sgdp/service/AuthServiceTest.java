package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.CambiarContrasenaRequest;
import gt.gob.sanraymundo.sgdp.dto.request.LoginRequest;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.HistorialContrasena;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.repository.HistorialContrasenaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private HistorialContrasenaRepository historialContrasenaRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuditoriaService auditoriaService;
    @Mock private UsuarioService usuarioService;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_credencialesCorrectas_retornaToken() {
        Usuario usuario = crearUsuario("admin@muni.gt", RolUsuario.ADMINISTRADOR, 0);
        LoginRequest req = loginRequest("admin@muni.gt", "pass123");

        when(usuarioRepository.findByNombreUsuario("admin@muni.gt")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("pass123", usuario.getContrasenaHash())).thenReturn(true);
        when(jwtUtil.generateToken(any())).thenReturn("jwt-token");

        var response = authService.login(req, "127.0.0.1");

        assertThat(response.getToken()).isEqualTo("jwt-token");
        assertThat(response.getRol()).isEqualTo("ADMINISTRADOR");
    }

    @Test
    void login_contrasenaIncorrecta_incrementaIntentosFallidos() {
        Usuario usuario = crearUsuario("user@muni.gt", RolUsuario.FUNCIONARIO, 0);
        LoginRequest req = loginRequest("user@muni.gt", "wrongpass");

        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(usuarioService.registrarIntentoFallido(eq(1L), anyInt(), anyInt())).thenAnswer(inv -> {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);
            return usuario;
        });

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class);

        assertThat(usuario.getIntentosFallidos()).isEqualTo(1);
    }

    @Test
    void login_tresFallos_bloqueaCuenta() {
        Usuario usuario = crearUsuario("user@muni.gt", RolUsuario.FUNCIONARIO, 2);
        LoginRequest req = loginRequest("user@muni.gt", "wrong");

        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);
        when(usuarioService.registrarIntentoFallido(eq(1L), anyInt(), anyInt())).thenAnswer(inv -> {
            usuario.setIntentosFallidos(usuario.getIntentosFallidos() + 1);
            if (usuario.getIntentosFallidos() >= 3) {
                usuario.setBloqueadoHasta(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15));
                usuario.setIntentosFallidos(0);
            }
            return usuario;
        });

        // Al llegar a 3 intentos, AuthService lanza NegocioException (cuenta bloqueada)
        assertThatThrownBy(() -> authService.login(req, "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("bloqueada");

        assertThat(usuario.getBloqueadoHasta()).isNotNull();
        assertThat(usuario.getBloqueadoHasta()).isAfter(LocalDateTime.now(ZoneOffset.UTC));
    }

    @Test
    void login_cuentaBloqueada_lanzaNegocioException() {
        Usuario usuario = crearUsuario("user@muni.gt", RolUsuario.FUNCIONARIO, 0);
        usuario.setBloqueadoHasta(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(10));
        LoginRequest req = loginRequest("user@muni.gt", "cualquier");

        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> authService.login(req, "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("bloqueada");
    }

    @Test
    void login_usuarioInexistente_lanzaBadCredentials() {
        when(usuarioRepository.findByNombreUsuario(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest("nadie@muni.gt", "pass"), "127.0.0.1"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_cuentaDesactivada_lanzaNegocioException() {
        Usuario usuario = crearUsuario("user@muni.gt", RolUsuario.FUNCIONARIO, 0);
        usuario.setActivo(false);
        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> authService.login(loginRequest("user@muni.gt", "pass"), "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("desactivada");
    }

    // ── cambiarContrasena ────────────────────────────────────────────────────

    @Test
    void cambiarContrasena_usuarioNoExiste_lanzaExcepcion() {
        when(usuarioRepository.findByNombreUsuario("nadie")).thenReturn(Optional.empty());
        CambiarContrasenaRequest req = cambiarRequest("actual", "Nueva1!23");

        assertThatThrownBy(() -> authService.cambiarContrasena("nadie", req, "127.0.0.1"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void cambiarContrasena_actualIncorrecta_lanzaExcepcion() {
        Usuario usuario = crearUsuario("juan", RolUsuario.FUNCIONARIO, 0);
        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("actualMal", usuario.getContrasenaHash())).thenReturn(false);

        CambiarContrasenaRequest req = cambiarRequest("actualMal", "Nueva1!23");

        assertThatThrownBy(() -> authService.cambiarContrasena("juan", req, "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("incorrecta");
    }

    @Test
    void cambiarContrasena_reutilizaUltimas3_lanzaExcepcion() {
        Usuario usuario = crearUsuario("juan", RolUsuario.FUNCIONARIO, 0);
        HistorialContrasena h1 = HistorialContrasena.builder().contrasenaHash("hashViejo").build();

        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("actual", usuario.getContrasenaHash())).thenReturn(true);
        when(historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(usuario))
                .thenReturn(List.of(h1));
        when(passwordEncoder.matches("Nueva1!23", "hashViejo")).thenReturn(true);

        CambiarContrasenaRequest req = cambiarRequest("actual", "Nueva1!23");

        assertThatThrownBy(() -> authService.cambiarContrasena("juan", req, "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("últimas 3");
    }

    @Test
    void cambiarContrasena_igualALaActual_lanzaExcepcion() {
        Usuario usuario = crearUsuario("juan", RolUsuario.FUNCIONARIO, 0);

        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("actual", usuario.getContrasenaHash())).thenReturn(true);
        when(historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(usuario))
                .thenReturn(List.of());
        when(passwordEncoder.matches("actual", usuario.getContrasenaHash())).thenReturn(true);

        CambiarContrasenaRequest req = cambiarRequest("actual", "actual");

        assertThatThrownBy(() -> authService.cambiarContrasena("juan", req, "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("igual a la contraseña actual");
    }

    @Test
    void cambiarContrasena_exitoso_actualizaHashYGuardaHistorial() {
        Usuario usuario = crearUsuario("juan", RolUsuario.FUNCIONARIO, 0);

        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("actual", usuario.getContrasenaHash())).thenReturn(true);
        when(historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(usuario))
                .thenReturn(List.of());
        when(passwordEncoder.matches("Nueva1!23", usuario.getContrasenaHash())).thenReturn(false);
        when(passwordEncoder.encode("Nueva1!23")).thenReturn("hashNuevo");

        CambiarContrasenaRequest req = cambiarRequest("actual", "Nueva1!23");

        authService.cambiarContrasena("juan", req, "127.0.0.1");

        assertThat(usuario.getContrasenaHash()).isEqualTo("hashNuevo");
        assertThat(usuario.getRequiereCambioContrasena()).isFalse();
        verify(historialContrasenaRepository).save(any(HistorialContrasena.class));
        verify(usuarioRepository).save(usuario);
    }

    // ── logout ────────────────────────────────────────────────────────────────

    @Test
    void logout_usuarioExiste_registraAuditoria() {
        Usuario usuario = crearUsuario("juan", RolUsuario.FUNCIONARIO, 0);
        when(usuarioRepository.findByNombreUsuario("juan")).thenReturn(Optional.of(usuario));

        authService.logout("juan", "127.0.0.1");

        verify(auditoriaService).registrarExito(eq(1L), eq("juan"), eq("127.0.0.1"), any(), eq("USUARIO"), eq("1"), eq("Logout exitoso"));
    }

    @Test
    void logout_usuarioNoExiste_noRegistraAuditoria() {
        when(usuarioRepository.findByNombreUsuario("fantasma")).thenReturn(Optional.empty());

        authService.logout("fantasma", "127.0.0.1");

        verify(auditoriaService, never()).registrarExito(any(), anyString(), anyString(), any(), anyString(), anyString(), anyString());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private CambiarContrasenaRequest cambiarRequest(String actual, String nueva) {
        CambiarContrasenaRequest req = new CambiarContrasenaRequest();
        req.setContrasenaActual(actual);
        req.setContrasenaNueva(nueva);
        return req;
    }

    private Usuario crearUsuario(String nombreUsuario, RolUsuario rol, int intentosFallidos) {
        return Usuario.builder()
                .id(1L)
                .nombreUsuario(nombreUsuario)
                .contrasenaHash("$2a$12$hashedpassword")
                .nombreCompleto("Test Usuario")
                .rol(rol)
                .activo(true)
                .intentosFallidos(intentosFallidos)
                .build();
    }

    private LoginRequest loginRequest(String nombreUsuario, String contrasena) {
        LoginRequest req = new LoginRequest();
        req.setNombreUsuario(nombreUsuario);
        req.setContrasena(contrasena);
        return req;
    }
}
