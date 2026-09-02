package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.response.NotificacionResponse;
import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.CategoriaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    @Mock private SolicitudRepository solicitudRepository;
    @Mock private CarpetaOficioRepository carpetaOficioRepository;
    @Mock private DiasHabilesService diasHabilesService;

    @InjectMocks
    private NotificacionService notificacionService;

    private SolicitudInformacion crearSolicitud(Long id, EstadoSolicitud estado, LocalDate fechaLimite) {
        return SolicitudInformacion.builder()
                .id(id)
                .codigoExpediente("SOL-2026-000" + id)
                .nombreSolicitante("Solicitante " + id)
                .descripcionSolicitud("Descripción")
                .fechaRecepcion(LocalDate.now().minusDays(5))
                .fechaLimite(fechaLimite)
                .estado(estado)
                .build();
    }

    @Test
    void listar_solicitudVencidaPersistida_generaNotificacionVencida() {
        SolicitudInformacion vencida = crearSolicitud(1L, EstadoSolicitud.VENCIDA, LocalDate.now().minusDays(2));
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(vencida));
        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of());

        List<NotificacionResponse> result = notificacionService.listar();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipo()).isEqualTo("SOLICITUD_VENCIDA");
        assertThat(result.get(0).getCodigoExpediente()).isEqualTo("SOL-2026-0001");
    }

    @Test
    void listar_fechaLimiteYaPaso_seClasificaComoVencidaAunqueEstadoNoSeaVencida() {
        SolicitudInformacion pasada = crearSolicitud(2L, EstadoSolicitud.EN_PROCESO, LocalDate.now().minusDays(1));
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(pasada));
        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of());

        List<NotificacionResponse> result = notificacionService.listar();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipo()).isEqualTo("SOLICITUD_VENCIDA");
    }

    @Test
    void listar_pocosDiasRestantes_generaNotificacionPorVencer() {
        SolicitudInformacion proxima = crearSolicitud(3L, EstadoSolicitud.EN_PROCESO, LocalDate.now().plusDays(5));
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(proxima));
        when(diasHabilesService.diasHabilesRestantes(proxima.getFechaLimite())).thenReturn(2);
        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of());

        List<NotificacionResponse> result = notificacionService.listar();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipo()).isEqualTo("SOLICITUD_POR_VENCER");
        assertThat(result.get(0).getDiasRestantes()).isEqualTo(2);
    }

    @Test
    void listar_diasRestantesSuficientes_noGeneraNotificacion() {
        SolicitudInformacion lejana = crearSolicitud(4L, EstadoSolicitud.EN_PROCESO, LocalDate.now().plusDays(20));
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of(lejana));
        when(diasHabilesService.diasHabilesRestantes(lejana.getFechaLimite())).thenReturn(15);
        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of());

        List<NotificacionResponse> result = notificacionService.listar();

        assertThat(result).isEmpty();
    }

    @Test
    void listar_carpetaOficioDesactualizada_generaNotificacion() {
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of());

        CategoriaOficio categoria = new CategoriaOficio();
        categoria.setId(1);
        categoria.setSeccion("LAIP");
        categoria.setNumero((short) 1);
        categoria.setNombre("Estructura Orgánica");

        CarpetaOficio carpeta = CarpetaOficio.builder()
                .id(10L)
                .categoria(categoria)
                .nombre("Carpeta 2026")
                .build();

        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of(carpeta));

        List<NotificacionResponse> result = notificacionService.listar();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTipo()).isEqualTo("OFICIO_DESACTUALIZADO");
        assertThat(result.get(0).getReferenciaId()).isEqualTo(10L);
        assertThat(result.get(0).getMensaje()).contains("LAIP", "Carpeta 2026");
    }

    @Test
    void listar_sinDatos_retornaListaVacia() {
        when(solicitudRepository.findByEstadoIn(any())).thenReturn(List.of());
        when(carpetaOficioRepository.findCarpetasDesactualizadas(any())).thenReturn(List.of());

        assertThat(notificacionService.listar()).isEmpty();
    }
}
