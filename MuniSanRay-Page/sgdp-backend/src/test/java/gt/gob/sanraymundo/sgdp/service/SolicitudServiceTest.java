package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.DenegarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.PresentarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ProrrogarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResponderSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudAdminResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudPublicaResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.model.entity.SecuenciaCodigo;
import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.SecuenciaRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SolicitudServiceTest {

    @Mock private SolicitudRepository solicitudRepository;
    @Mock private SecuenciaRepository secuenciaRepository;
    @Mock private DiasHabilesService diasHabilesService;
    @Mock private EmailService emailService;
    @Mock private AuditoriaService auditoriaService;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private DocumentoRepository documentoRepository;

    @InjectMocks
    private SolicitudService solicitudService;

    @Test
    void presentarSolicitud_datosValidos_retornaCodigo() {
        PresentarSolicitudRequest req = crearRequest("Juan Pérez");
        SecuenciaCodigo seq = crearSecuencia();

        when(secuenciaRepository.findByTipoForUpdate("SOLICITUD")).thenReturn(Optional.of(seq));
        when(diasHabilesService.calcularFechaLimite(any(), eq(10))).thenReturn(LocalDate.now().plusDays(14));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudPublicaResponse resp = solicitudService.presentarSolicitud(req, "127.0.0.1");

        assertThat(resp.getCodigoExpediente()).startsWith("SOL-");
        assertThat(resp.getEstado()).isEqualTo("PENDIENTE");
    }

    @Test
    void presentarSolicitud_conCorreo_enviaEmail() {
        PresentarSolicitudRequest req = crearRequest("Maria García");
        SecuenciaCodigo seq = crearSecuencia();

        when(secuenciaRepository.findByTipoForUpdate("SOLICITUD")).thenReturn(Optional.of(seq));
        when(diasHabilesService.calcularFechaLimite(any(), eq(10))).thenReturn(LocalDate.now().plusDays(14));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        solicitudService.presentarSolicitud(req, "192.168.1.1");

        verify(emailService).enviarConfirmacionSolicitud(
                eq("solicitante@test.com"), anyString(), anyString(), any(), anyString());
    }

    @Test
    void presentarSolicitud_persiste_conEstadoPendiente() {
        PresentarSolicitudRequest req = crearRequest("Carlos López");
        SecuenciaCodigo seq = crearSecuencia();

        when(secuenciaRepository.findByTipoForUpdate("SOLICITUD")).thenReturn(Optional.of(seq));
        when(diasHabilesService.calcularFechaLimite(any(), eq(10))).thenReturn(LocalDate.now().plusDays(14));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        solicitudService.presentarSolicitud(req, "10.0.0.1");

        ArgumentCaptor<SolicitudInformacion> captor = ArgumentCaptor.forClass(SolicitudInformacion.class);
        verify(solicitudRepository).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(EstadoSolicitud.PENDIENTE);
        assertThat(captor.getValue().getCodigoExpediente()).isNotBlank();
    }

    @Test
    void consultarSeguimiento_codigoInexistente_lanzaExcepcion() {
        when(solicitudRepository.findByCodigoExpediente("SOL-FAKE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> solicitudService.consultarSeguimiento("SOL-FAKE"))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    void consultarSeguimiento_codigoValido_retornaEstado() {
        SolicitudInformacion sol = SolicitudInformacion.builder()
                .codigoExpediente("SOL-2026-0001")
                .nombreSolicitante("Test")
                .descripcionSolicitud("Descripción de la solicitud")
                .fechaRecepcion(LocalDate.now())
                .fechaLimite(LocalDate.now().plusDays(10))
                .estado(EstadoSolicitud.PENDIENTE)
                .build();

        when(solicitudRepository.findByCodigoExpediente("SOL-2026-0001")).thenReturn(Optional.of(sol));

        var resp = solicitudService.consultarSeguimiento("SOL-2026-0001");

        assertThat(resp.getEstado()).isEqualTo("PENDIENTE");
        assertThat(resp.getCodigoExpediente()).isEqualTo("SOL-2026-0001");
    }

    @Test
    void generarCodigoExpediente_secuenciaAumentaUno() {
        SecuenciaCodigo seq = crearSecuencia();
        int numAntes = seq.getUltimoNum();

        when(secuenciaRepository.findByTipoForUpdate("SOLICITUD")).thenReturn(Optional.of(seq));
        when(secuenciaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        solicitudService.generarCodigoExpediente();

        assertThat(seq.getUltimoNum()).isEqualTo(numAntes + 1);
    }

    // ── asignarOficial: reglas de permisos ─────────────────────────────────────

    @Test
    void asignarOficial_comoAdministrador_puedeAsignarCualquierOficial() {
        SolicitudInformacion sol = crearSolicitudAsignable(null);
        Usuario admin = crearUsuario(1L, "admin1", RolUsuario.ADMINISTRADOR);
        Usuario oficial = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(admin));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(oficial));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse resp = solicitudService.asignarOficial(10L, 2L, "admin1", "127.0.0.1");

        assertThat(resp).isNotNull();
        assertThat(sol.getOficialAsignado()).isEqualTo(oficial);
        assertThat(sol.getEstado()).isEqualTo(EstadoSolicitud.EN_PROCESO);
    }

    @Test
    void asignarOficial_yaTieneOficialAsignado_lanzaExcepcion() {
        Usuario oficialActual = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialActual);
        Usuario otroOficial = crearUsuario(3L, "oficial2", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));

        assertThatThrownBy(() -> solicitudService.asignarOficial(10L, otroOficial.getId(), "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("ya tiene un oficial asignado");

        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void asignarOficial_comoOficial_intentaAsignarOtroOficial_lanzaExcepcion() {
        SolicitudInformacion sol = crearSolicitudAsignable(null);
        Usuario actor = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial1")).thenReturn(Optional.of(actor));

        assertThatThrownBy(() -> solicitudService.asignarOficial(10L, 3L, "oficial1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("solo puede asignarse");
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void asignarOficial_comoOficial_puedeAsignarseASiMismo() {
        SolicitudInformacion sol = crearSolicitudAsignable(null);
        Usuario actor = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial1")).thenReturn(Optional.of(actor));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(actor));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse resp = solicitudService.asignarOficial(10L, 2L, "oficial1", "127.0.0.1");

        assertThat(resp).isNotNull();
        assertThat(sol.getOficialAsignado()).isEqualTo(actor);
    }

    // ── responder / prorrogar / denegar: solo el oficial asignado puede actuar ─

    @Test
    void responder_comoAdministrador_lanzaExcepcion() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        Usuario admin = crearUsuario(1L, "admin1", RolUsuario.ADMINISTRADOR);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> solicitudService.responder(10L, new ResponderSolicitudRequest(), "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Solo un oficial asignado");
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void responder_comoOficialNoAsignado_lanzaExcepcion() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        Usuario otroOficial = crearUsuario(3L, "oficial2", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial2")).thenReturn(Optional.of(otroOficial));

        assertThatThrownBy(() -> solicitudService.responder(10L, new ResponderSolicitudRequest(), "oficial2", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Debe estar asignado");
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void responder_comoOficialAsignado_marcaRespondida() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        ResponderSolicitudRequest req = new ResponderSolicitudRequest();
        req.setRespuesta("Respuesta de prueba");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial1")).thenReturn(Optional.of(oficialAsignado));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse resp = solicitudService.responder(10L, req, "oficial1", "127.0.0.1");

        assertThat(resp).isNotNull();
        assertThat(sol.getEstado()).isEqualTo(EstadoSolicitud.RESPONDIDA);
        assertThat(sol.getRespuesta()).isEqualTo("Respuesta de prueba");
    }

    @Test
    void prorrogar_comoOficialNoAsignado_lanzaExcepcion() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        Usuario otroOficial = crearUsuario(3L, "oficial2", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial2")).thenReturn(Optional.of(otroOficial));

        ProrrogarSolicitudRequest req = new ProrrogarSolicitudRequest();
        req.setMotivoProrroga("Motivo");

        assertThatThrownBy(() -> solicitudService.prorrogar(10L, req, "oficial2", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Debe estar asignado");
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void prorrogar_comoOficialAsignado_actualizaFechaLimite() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        LocalDate nuevaFecha = LocalDate.now().plusDays(20);
        ProrrogarSolicitudRequest req = new ProrrogarSolicitudRequest();
        req.setMotivoProrroga("Se requiere más tiempo");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial1")).thenReturn(Optional.of(oficialAsignado));
        when(diasHabilesService.calcularFechaLimite(any(), eq(10))).thenReturn(nuevaFecha);
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse resp = solicitudService.prorrogar(10L, req, "oficial1", "127.0.0.1");

        assertThat(resp).isNotNull();
        assertThat(sol.getEstado()).isEqualTo(EstadoSolicitud.PRORROGADA);
        assertThat(sol.getFechaLimite()).isEqualTo(nuevaFecha);
    }

    @Test
    void denegar_comoAdministrador_lanzaExcepcion() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        Usuario admin = crearUsuario(1L, "admin1", RolUsuario.ADMINISTRADOR);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(admin));

        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("No procede");

        assertThatThrownBy(() -> solicitudService.denegar(10L, req, "admin1", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Solo un oficial asignado");
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void denegar_comoOficialAsignado_marcaDenegada() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial1", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("No aplica LAIP");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial1")).thenReturn(Optional.of(oficialAsignado));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse resp = solicitudService.denegar(10L, req, "oficial1", "127.0.0.1");

        assertThat(resp).isNotNull();
        assertThat(sol.getEstado()).isEqualTo(EstadoSolicitud.DENEGADA);
        assertThat(sol.getCausalDenegacion()).isEqualTo("No aplica LAIP");
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    @Test
    void asignarOficial_solicitudVencida_permiteAsignarYPasaAEnProceso() {
        SolicitudInformacion sol = crearSolicitudAsignable(null);
        sol.setEstado(EstadoSolicitud.VENCIDA);
        Usuario admin = crearUsuario(1L, "admin1", RolUsuario.ADMINISTRADOR);
        Usuario oficial = crearUsuario(2L, "oficial2", RolUsuario.OFICIAL);

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("admin1")).thenReturn(Optional.of(admin));
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(oficial));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse result = solicitudService.asignarOficial(10L, 2L, "admin1", "127.0.0.1");

        assertThat(result.getEstado()).isEqualTo(EstadoSolicitud.EN_PROCESO.name());
    }

    @Test
    void prorrogar_solicitudVencida_permiteProrrogar() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial2", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        sol.setEstado(EstadoSolicitud.VENCIDA);
        ProrrogarSolicitudRequest req = new ProrrogarSolicitudRequest();
        req.setMotivoProrroga("Justificación de la prórroga");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial2")).thenReturn(Optional.of(oficialAsignado));
        when(diasHabilesService.calcularFechaLimite(any(), eq(10))).thenReturn(LocalDate.now().plusDays(10));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse result = solicitudService.prorrogar(10L, req, "oficial2", "127.0.0.1");

        assertThat(result.getEstado()).isEqualTo(EstadoSolicitud.PRORROGADA.name());
    }

    @Test
    void responder_solicitudVencida_permiteResponder() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial2", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        sol.setEstado(EstadoSolicitud.VENCIDA);
        ResponderSolicitudRequest req = new ResponderSolicitudRequest();
        req.setRespuesta("Respuesta a la solicitud vencida");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial2")).thenReturn(Optional.of(oficialAsignado));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse result = solicitudService.responder(10L, req, "oficial2", "127.0.0.1");

        assertThat(result.getEstado()).isEqualTo(EstadoSolicitud.RESPONDIDA.name());
    }

    @Test
    void denegar_solicitudVencida_permiteDenegar() {
        Usuario oficialAsignado = crearUsuario(2L, "oficial2", RolUsuario.OFICIAL);
        SolicitudInformacion sol = crearSolicitudAsignable(oficialAsignado);
        sol.setEstado(EstadoSolicitud.VENCIDA);
        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("Información reservada");

        when(solicitudRepository.findById(10L)).thenReturn(Optional.of(sol));
        when(usuarioRepository.findByNombreUsuario("oficial2")).thenReturn(Optional.of(oficialAsignado));
        when(solicitudRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SolicitudAdminResponse result = solicitudService.denegar(10L, req, "oficial2", "127.0.0.1");

        assertThat(result.getEstado()).isEqualTo(EstadoSolicitud.DENEGADA.name());
    }

    private Usuario crearUsuario(Long id, String nombreUsuario, RolUsuario rol) {
        return Usuario.builder()
                .id(id)
                .nombreUsuario(nombreUsuario)
                .nombreCompleto("Usuario " + nombreUsuario)
                .rol(rol)
                .build();
    }

    private SolicitudInformacion crearSolicitudAsignable(Usuario oficialAsignado) {
        return SolicitudInformacion.builder()
                .id(10L)
                .codigoExpediente("SOL-2026-0010")
                .nombreSolicitante("Solicitante Test")
                .descripcionSolicitud("Descripción de prueba para asignación")
                .fechaRecepcion(LocalDate.now())
                .fechaLimite(LocalDate.now().plusDays(10))
                .estado(oficialAsignado == null ? EstadoSolicitud.PENDIENTE : EstadoSolicitud.EN_PROCESO)
                .oficialAsignado(oficialAsignado)
                .build();
    }

    private PresentarSolicitudRequest crearRequest(String nombre) {
        PresentarSolicitudRequest req = new PresentarSolicitudRequest();
        req.setNombreSolicitante(nombre);
        req.setDpiSolicitante("1234567890123");
        req.setCorreoSolicitante("solicitante@test.com");
        req.setDescripcionSolicitud("Solicitud de información sobre el presupuesto municipal del año en curso");
        return req;
    }

    private SecuenciaCodigo crearSecuencia() {
        return SecuenciaCodigo.builder()
                .tipo("SOLICITUD")
                .prefijo("SOL")
                .anio(LocalDate.now().getYear())
                .ultimoNum(0)
                .build();
    }
}
