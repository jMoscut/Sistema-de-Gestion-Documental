package gt.gob.sanraymundo.sgdp.scheduler;

import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.service.AuditoriaService;
import gt.gob.sanraymundo.sgdp.service.DiasHabilesService;
import gt.gob.sanraymundo.sgdp.service.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlazosSchedulerTest {

    @Mock private SolicitudRepository solicitudRepository;
    @Mock private DiasHabilesService diasHabilesService;
    @Mock private EmailService emailService;
    @Mock private AuditoriaService auditoriaService;

    @InjectMocks
    private PlazosScheduler plazosScheduler;

    private SolicitudInformacion crearSolicitud(Long id, LocalDate fechaLimite, EstadoSolicitud estado, String correo) {
        return SolicitudInformacion.builder()
                .id(id)
                .codigoExpediente("SOL-2026-000" + id)
                .nombreSolicitante("Solicitante " + id)
                .correoSolicitante(correo)
                .descripcionSolicitud("Descripción")
                .fechaRecepcion(LocalDate.now().minusDays(5))
                .fechaLimite(fechaLimite)
                .estado(estado)
                .build();
    }

    @Test
    void verificarPlazos_fechaLimitePasada_marcaVencidaYAuditaEvento() {
        SolicitudInformacion vencida = crearSolicitud(1L, LocalDate.now().minusDays(1), EstadoSolicitud.EN_PROCESO, "a@x.com");
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(vencida));

        plazosScheduler.verificarPlazos();

        verify(solicitudRepository).save(vencida);
        assert vencida.getEstado() == EstadoSolicitud.VENCIDA;
        verify(auditoriaService).registrarExito(isNull(), eq("scheduler"), eq("127.0.0.1"), any(), eq("SOLICITUD"), eq("1"), eq("SOL-2026-0001"));
        verify(emailService, never()).alertaDia7(anyString(), anyString(), anyString(), any(), anyInt());
    }

    @Test
    void verificarPlazos_fechaLimiteHoy_seMarcaVencida() {
        SolicitudInformacion hoy = crearSolicitud(2L, LocalDate.now(), EstadoSolicitud.PENDIENTE, "b@x.com");
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(hoy));

        plazosScheduler.verificarPlazos();

        assert hoy.getEstado() == EstadoSolicitud.VENCIDA;
        verify(solicitudRepository).save(hoy);
    }

    @Test
    void verificarPlazos_pocosDiasRestantes_enviaAlerta() {
        SolicitudInformacion proxima = crearSolicitud(3L, LocalDate.now().plusDays(5), EstadoSolicitud.EN_PROCESO, "c@x.com");
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(proxima));
        when(diasHabilesService.diasHabilesRestantes(proxima.getFechaLimite())).thenReturn(2);

        plazosScheduler.verificarPlazos();

        verify(emailService).alertaDia7(eq("c@x.com"), eq("Solicitante 3"), eq("SOL-2026-0003"), eq(proxima.getFechaLimite()), eq(2));
        verify(solicitudRepository, never()).save(any());
    }

    @Test
    void verificarPlazos_sinCorreoSolicitante_noEnviaAlerta() {
        SolicitudInformacion sinCorreo = crearSolicitud(4L, LocalDate.now().plusDays(5), EstadoSolicitud.EN_PROCESO, null);
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(sinCorreo));
        when(diasHabilesService.diasHabilesRestantes(sinCorreo.getFechaLimite())).thenReturn(1);

        plazosScheduler.verificarPlazos();

        verify(emailService, never()).alertaDia7(anyString(), anyString(), anyString(), any(), anyInt());
    }

    @Test
    void verificarPlazos_diasRestantesSuficientes_noEnviaAlerta() {
        SolicitudInformacion lejana = crearSolicitud(5L, LocalDate.now().plusDays(20), EstadoSolicitud.EN_PROCESO, "e@x.com");
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(lejana));
        when(diasHabilesService.diasHabilesRestantes(lejana.getFechaLimite())).thenReturn(10);

        plazosScheduler.verificarPlazos();

        verify(emailService, never()).alertaDia7(anyString(), anyString(), anyString(), any(), anyInt());
    }

    @Test
    void verificarPlazos_sinSolicitudesActivas_noHaceNada() {
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of());

        plazosScheduler.verificarPlazos();

        verify(solicitudRepository, never()).save(any());
        verify(emailService, never()).alertaDia7(anyString(), anyString(), anyString(), any(), anyInt());
    }
}
