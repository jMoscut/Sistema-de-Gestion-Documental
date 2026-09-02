package gt.gob.sanraymundo.sgdp.scheduler;

import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.service.AuditoriaService;
import gt.gob.sanraymundo.sgdp.service.DiasHabilesService;
import gt.gob.sanraymundo.sgdp.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PlazosScheduler {

    private final SolicitudRepository solicitudRepository;
    private final DiasHabilesService diasHabilesService;
    private final EmailService emailService;
    private final AuditoriaService auditoriaService;

    /**
     * Diario 7:00 AM Guatemala (UTC-6 = 13:00 UTC).
     * 1. Marca VENCIDA solicitudes que superaron fecha límite.
     * 2. Envía alerta email a solicitante cuando quedan ≤ 3 días hábiles.
     */
    @Scheduled(cron = "0 0 13 * * *")
    @Transactional
    public void verificarPlazos() {
        LocalDate hoy = LocalDate.now();

        List<EstadoSolicitud> estadosActivos = List.of(
                EstadoSolicitud.PENDIENTE,
                EstadoSolicitud.EN_PROCESO,
                EstadoSolicitud.PRORROGADA
        );

        List<SolicitudInformacion> activas = solicitudRepository.findByEstadoIn(estadosActivos);
        int vencidas = 0;
        int alertadas = 0;

        for (SolicitudInformacion sol : activas) {
            LocalDate limite = sol.getFechaLimite();

            // Vencidas: fecha límite ya pasó
            if (!limite.isAfter(hoy)) {
                sol.setEstado(EstadoSolicitud.VENCIDA);
                solicitudRepository.save(sol);
                auditoriaService.registrarExito(
                        null, "scheduler", "127.0.0.1",
                        TipoAccion.VENCIMIENTO_SOL,
                        "SOLICITUD", sol.getId().toString(),
                        sol.getCodigoExpediente()
                );
                vencidas++;
                continue;
            }

            // Alerta: ≤ 3 días hábiles restantes
            int diasRestantes = diasHabilesService.diasHabilesRestantes(limite);
            if (diasRestantes <= 3 && sol.getCorreoSolicitante() != null) {
                emailService.alertaDia7(
                        sol.getCorreoSolicitante(),
                        sol.getNombreSolicitante(),
                        sol.getCodigoExpediente(),
                        limite,
                        diasRestantes
                );
                alertadas++;
            }
        }

        log.info("PlazosScheduler: {} vencidas, {} alertas enviadas", vencidas, alertadas);
    }
}
