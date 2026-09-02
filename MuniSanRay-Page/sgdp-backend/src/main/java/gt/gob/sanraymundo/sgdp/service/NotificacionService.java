package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.response.NotificacionResponse;
import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private static final int DIAS_ALERTA_SOLICITUD = 3;
    private static final int DIAS_ALERTA_OFICIO = 25;

    private final SolicitudRepository solicitudRepository;
    private final CarpetaOficioRepository carpetaOficioRepository;
    private final DiasHabilesService diasHabilesService;

    @Transactional(readOnly = true)
    public List<NotificacionResponse> listar() {
        List<NotificacionResponse> notificaciones = new ArrayList<>();
        LocalDate hoy = LocalDate.now();

        List<SolicitudInformacion> activas = solicitudRepository.findByEstadoIn(List.of(
                EstadoSolicitud.PENDIENTE, EstadoSolicitud.EN_PROCESO,
                EstadoSolicitud.PRORROGADA, EstadoSolicitud.VENCIDA
        ));

        for (SolicitudInformacion sol : activas) {
            boolean vencida = sol.getEstado() == EstadoSolicitud.VENCIDA
                    || !sol.getFechaLimite().isAfter(hoy);

            if (vencida) {
                notificaciones.add(NotificacionResponse.builder()
                        .tipo("SOLICITUD_VENCIDA")
                        .titulo("Solicitud vencida")
                        .mensaje("El expediente " + sol.getCodigoExpediente() + " superó el plazo legal de respuesta.")
                        .referenciaId(sol.getId())
                        .codigoExpediente(sol.getCodigoExpediente())
                        .build());
                continue;
            }

            int diasRestantes = diasHabilesService.diasHabilesRestantes(sol.getFechaLimite());
            if (diasRestantes <= DIAS_ALERTA_SOLICITUD) {
                notificaciones.add(NotificacionResponse.builder()
                        .tipo("SOLICITUD_POR_VENCER")
                        .titulo("Solicitud próxima a vencer")
                        .mensaje("El expediente " + sol.getCodigoExpediente() + " vence en "
                                + diasRestantes + " día(s) hábil(es).")
                        .referenciaId(sol.getId())
                        .codigoExpediente(sol.getCodigoExpediente())
                        .diasRestantes(diasRestantes)
                        .build());
            }
        }

        LocalDateTime umbralOficio = LocalDateTime.now().minusDays(DIAS_ALERTA_OFICIO);
        List<CarpetaOficio> desactualizadas = carpetaOficioRepository.findCarpetasDesactualizadas(umbralOficio);
        for (CarpetaOficio carpeta : desactualizadas) {
            notificaciones.add(NotificacionResponse.builder()
                    .tipo("OFICIO_DESACTUALIZADO")
                    .titulo("Información de oficio desactualizada")
                    .mensaje(carpeta.getCategoria().getSeccion() + " › " + carpeta.getNombre()
                            + " no tiene documentos nuevos en más de " + DIAS_ALERTA_OFICIO + " días.")
                    .referenciaId(carpeta.getId())
                    .build());
        }

        return notificaciones;
    }
}
