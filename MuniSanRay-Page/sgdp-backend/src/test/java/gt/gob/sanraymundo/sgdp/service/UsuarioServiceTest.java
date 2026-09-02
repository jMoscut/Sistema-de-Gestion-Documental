package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.ActualizarUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResetPasswordRequest;
import gt.gob.sanraymundo.sgdp.dto.response.UsuarioResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.model.entity.HistorialContrasena;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.repository.HistorialContrasenaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private HistorialContrasenaRepository historialContrasenaRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditoriaService auditoriaService;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario crearUsuario(Long id, String nombreUsuario) {
        return Usuario.builder()
                .id(id)
                .nombreUsuario(nombreUsuario)
                .nombreCompleto("Usuario " + nombreUsuario)
                .correoElectronico(nombreUsuario + "@sanraymundo.gob.gt")
                .contrasenaHash("hashViejo")
                .rol(RolUsuario.FUNCIONARIO)
                .activo(true)
                .intentosFallidos(0)
                .build();
    }

    @Test
    void listar_incluirInactivosFalse_usaFindByActivoTrue() {
        Usuario u = crearUsuario(1L, "juan");
        when(usuarioRepository.findByActivoTrue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(u)));

        Page<UsuarioResponse> result = usuarioService.listar(Pageable.unpaged(), false);

        assertThat(result.getContent()).hasSize(1);
        verify(usuarioRepository, never()).findAll(any(Pageable.class));
    }

    @Test
    void listar_incluirInactivosTrue_usaFindAll() {
        when(usuarioRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));

        usuarioService.listar(Pageable.unpaged(), true);

        verify(usuarioRepository).findAll(any(Pageable.class));
        verify(usuarioRepository, never()).findByActivoTrue(any(Pageable.class));
    }

    @Test
    void obtenerPorId_noExiste_lanzaExcepcion() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.obtenerPorId(99L))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("no encontrado");
    }

    @Test
    void obtenerPorId_existe_retornaUsuario() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(crearUsuario(1L, "juan")));

        UsuarioResponse result = usuarioService.obtenerPorId(1L);

        assertThat(result.getNombreUsuario()).isEqualTo("juan");
    }

    // ── crear ─────────────────────────────────────────────────────────────────

    private CrearUsuarioRequest crearRequest() {
        CrearUsuarioRequest req = new CrearUsuarioRequest();
        req.setNombreCompleto("Nuevo Usuario");
        req.setNombreUsuario("Nuevo.User");
        req.setCorreoElectronico("Nuevo@Sanraymundo.gob.gt");
        req.setContrasena("password123");
        req.setRol(RolUsuario.FUNCIONARIO);
        return req;
    }

    @Test
    void crear_nombreUsuarioDuplicado_lanzaExcepcion() {
        CrearUsuarioRequest req = crearRequest();
        when(usuarioRepository.existsByNombreUsuario("nuevo.user")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crear(req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("nombre de usuario ya está registrado");

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void crear_correoDuplicado_lanzaExcepcion() {
        CrearUsuarioRequest req = crearRequest();
        when(usuarioRepository.existsByNombreUsuario(anyString())).thenReturn(false);
        when(usuarioRepository.existsByCorreoElectronico("nuevo@sanraymundo.gob.gt")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crear(req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("correo ya está registrado");
    }

    @Test
    void crear_exitoso_normalizaYGuardaConHistorial() {
        CrearUsuarioRequest req = crearRequest();
        when(usuarioRepository.existsByNombreUsuario(anyString())).thenReturn(false);
        when(usuarioRepository.existsByCorreoElectronico(anyString())).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashNuevo");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> {
            Usuario u = inv.getArgument(0);
            u.setId(5L);
            return u;
        });
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(crearUsuario(1L, "admin1")));

        UsuarioResponse result = usuarioService.crear(req, "admin1", "127.0.0.1");

        assertThat(result.getNombreUsuario()).isEqualTo("nuevo.user");
        verify(historialContrasenaRepository).save(any(HistorialContrasena.class));
        verify(auditoriaService).registrarExito(eq(1L), eq("admin1"), eq("127.0.0.1"), any(), eq("USUARIO"), eq("5"), eq("nuevo.user"));
    }

    // ── actualizar ────────────────────────────────────────────────────────────

    @Test
    void actualizar_noExiste_lanzaExcepcion() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());
        ActualizarUsuarioRequest req = new ActualizarUsuarioRequest();

        assertThatThrownBy(() -> usuarioService.actualizar(99L, req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class);
    }

    @Test
    void actualizar_nuevoNombreUsuarioYaEnUso_lanzaExcepcion() {
        Usuario existente = crearUsuario(1L, "juan");
        ActualizarUsuarioRequest req = new ActualizarUsuarioRequest();
        req.setNombreCompleto("Juan Actualizado");
        req.setNombreUsuario("carlos");
        req.setRol(RolUsuario.FUNCIONARIO);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.existsByNombreUsuario("carlos")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.actualizar(1L, req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("ya está en uso");

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void actualizar_exitoso_actualizaCampos() {
        Usuario existente = crearUsuario(1L, "juan");
        ActualizarUsuarioRequest req = new ActualizarUsuarioRequest();
        req.setNombreCompleto("Juan Actualizado");
        req.setNombreUsuario("juan");
        req.setCorreoElectronico("juan@sanraymundo.gob.gt");
        req.setRol(RolUsuario.OFICIAL);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(crearUsuario(2L, "admin1")));

        UsuarioResponse result = usuarioService.actualizar(1L, req, "admin1", "127.0.0.1");

        assertThat(result.getNombreCompleto()).isEqualTo("Juan Actualizado");
        assertThat(result.getRol()).isEqualTo("OFICIAL");
    }

    // ── toggleActivo ──────────────────────────────────────────────────────────

    @Test
    void toggleActivo_desactivaYLimpiaBloqueo() {
        Usuario existente = crearUsuario(1L, "juan");
        existente.setIntentosFallidos(3);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(crearUsuario(2L, "admin1")));

        UsuarioResponse result = usuarioService.toggleActivo(1L, "admin1", "127.0.0.1");

        assertThat(result.getActivo()).isFalse();
        assertThat(existente.getIntentosFallidos()).isEqualTo(0);
        assertThat(existente.getBloqueadoHasta()).isNull();
    }

    @Test
    void toggleActivo_noExiste_lanzaExcepcion() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.toggleActivo(99L, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class);
    }

    // ── resetearContrasena ────────────────────────────────────────────────────

    @Test
    void resetearContrasena_reutilizaUltimas3_lanzaExcepcion() {
        Usuario existente = crearUsuario(1L, "juan");
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setNuevaContrasena("passwordViejo");

        HistorialContrasena h1 = HistorialContrasena.builder().contrasenaHash("hash1").build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(existente))
                .thenReturn(List.of(h1));
        when(passwordEncoder.matches("passwordViejo", "hash1")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.resetearContrasena(1L, req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("últimas 3");

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void resetearContrasena_exitoso_actualizaYGuardaHistorial() {
        Usuario existente = crearUsuario(1L, "juan");
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setNuevaContrasena("passwordNuevo123");

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        when(historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(existente))
                .thenReturn(List.of());
        when(passwordEncoder.encode("passwordNuevo123")).thenReturn("hashNuevo");
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(crearUsuario(2L, "admin1")));

        usuarioService.resetearContrasena(1L, req, "admin1", "127.0.0.1");

        assertThat(existente.getContrasenaHash()).isEqualTo("hashNuevo");
        assertThat(existente.getRequiereCambioContrasena()).isTrue();
        verify(historialContrasenaRepository).save(any(HistorialContrasena.class));
        verify(usuarioRepository).save(existente);
    }
}
