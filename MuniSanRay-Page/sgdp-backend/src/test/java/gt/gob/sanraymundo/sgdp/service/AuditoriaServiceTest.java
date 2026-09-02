package gt.gob.sanraymundo.sgdp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import gt.gob.sanraymundo.sgdp.model.entity.RegistroAuditoria;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.AuditoriaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditoriaServiceTest {

    @Mock private AuditoriaRepository auditoriaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AuditoriaService auditoriaService;

    @Test
    void registrar_conUsuarioIdValido_asociaUsuario() {
        Usuario usuario = Usuario.builder().id(1L).nombreUsuario("juan").build();
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));

        auditoriaService.registrar(1L, "juan", "127.0.0.1", TipoAccion.CREATE_USER, "USUARIO", "5", "juan", "EXITO", null);

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(auditoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getUsuario()).isEqualTo(usuario);
        assertThat(captor.getValue().getAccion()).isEqualTo("CREATE_USER");
        assertThat(captor.getValue().getResultado()).isEqualTo("EXITO");
    }

    @Test
    void registrar_sinUsuarioId_noConsultaRepositorio() {
        auditoriaService.registrar(null, "scheduler", "127.0.0.1", TipoAccion.VENCIMIENTO_SOL, "SOLICITUD", "1", "SOL-1", "EXITO", null);

        verify(usuarioRepository, never()).findById(any());
        verify(auditoriaRepository).save(any(RegistroAuditoria.class));
    }

    @Test
    void registrar_resultadoNull_defaultEaExito() {
        auditoriaService.registrar(null, "sys", "127.0.0.1", TipoAccion.CREATE_USER, "USUARIO", "1", "x", null, null);

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(auditoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getResultado()).isEqualTo("EXITO");
    }

    @Test
    void registrar_conDetalle_serializaAJson() {
        auditoriaService.registrar(null, "admin", "127.0.0.1", TipoAccion.DISABLE_USER, "USUARIO", "1", "x", "EXITO", Map.of("estado", "activado"));

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(auditoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getDetalle()).contains("activado");
    }

    @Test
    void registrarExito_delegaARegistrarConResultadoExito() {
        auditoriaService.registrarExito(null, "admin", "127.0.0.1", TipoAccion.CREATE_USER, "USUARIO", "1", "juan");

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(auditoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getResultado()).isEqualTo("EXITO");
    }

    @Test
    void registrarExito_repositorioLanzaExcepcion_noPropaga() {
        when(auditoriaRepository.save(any())).thenThrow(new RuntimeException("DB caída"));

        auditoriaService.registrarExito(null, "admin", "127.0.0.1", TipoAccion.CREATE_USER, "USUARIO", "1", "juan");
        // no exception propagates — swallowed and logged
    }

    @Test
    void registrarFallo_delegaARegistrarConResultadoFallo() {
        auditoriaService.registrarFallo(null, "sistema", "127.0.0.1", TipoAccion.CREATE_USER, "Error de validación");

        ArgumentCaptor<RegistroAuditoria> captor = ArgumentCaptor.forClass(RegistroAuditoria.class);
        verify(auditoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getResultado()).isEqualTo("FALLO");
        assertThat(captor.getValue().getObjetoDesc()).isEqualTo("Error de validación");
    }

    @Test
    void registrarFallo_repositorioLanzaExcepcion_noPropaga() {
        when(auditoriaRepository.save(any())).thenThrow(new RuntimeException("DB caída"));

        auditoriaService.registrarFallo(null, "sistema", "127.0.0.1", TipoAccion.CREATE_USER, "error");
        // no exception propagates
    }
}
