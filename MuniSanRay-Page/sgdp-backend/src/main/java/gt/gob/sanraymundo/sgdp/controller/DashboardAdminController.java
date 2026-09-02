package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.ActualizarMetaRequest;
import gt.gob.sanraymundo.sgdp.dto.response.DashboardStatsResponse;
import gt.gob.sanraymundo.sgdp.dto.response.MetaModuloResponse;
import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.service.MetaCumplimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class DashboardAdminController {

    private static final int TOTAL_CATEGORIAS_LAIP = 29;

    private final SolicitudRepository solicitudRepository;
    private final DocumentoRepository documentoRepository;
    private final CarpetaOficioRepository carpetaOficioRepository;
    private final MetaCumplimientoService metaCumplimientoService;

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<DashboardStatsResponse> stats() {
        long pendientes  = solicitudRepository.countByEstado(EstadoSolicitud.PENDIENTE);
        long enProceso   = solicitudRepository.countByEstado(EstadoSolicitud.EN_PROCESO)
                         + solicitudRepository.countByEstado(EstadoSolicitud.PRORROGADA);
        long respondidas = solicitudRepository.countByEstado(EstadoSolicitud.RESPONDIDA);
        long total       = solicitudRepository.count();
        long docs        = documentoRepository.count();
        int conContenido = (int) carpetaOficioRepository.countCategoriasConContenidoEnSeccion("LAIP");
        int pct          = (conContenido * 100) / TOTAL_CATEGORIAS_LAIP;

        LocalDateTime umbral25Dias = LocalDateTime.now().minusDays(25);
        List<CarpetaOficio> desactualizadas = carpetaOficioRepository.findCarpetasDesactualizadas(umbral25Dias);
        List<String> nombresDesactualizadas = desactualizadas.stream()
                .map(c -> c.getCategoria().getSeccion() + " › " + c.getNombre())
                .toList();

        return ResponseEntity.ok(DashboardStatsResponse.builder()
                .solicitudesPendientes(pendientes)
                .solicitudesEnProceso(enProceso)
                .solicitudesRespondidas(respondidas)
                .solicitudesTotal(total)
                .documentosTotal(docs)
                .oficioPublicadas(conContenido)
                .porcentajeCumplimiento(pct)
                .carpetasDesactualizadasCount(desactualizadas.size())
                .carpetasDesactualizadas(nombresDesactualizadas)
                .build());
    }

    @GetMapping("/metas")
    public ResponseEntity<List<MetaModuloResponse>> metas() {
        return ResponseEntity.ok(metaCumplimientoService.calcularMetas());
    }

    @PatchMapping("/metas/{modulo}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<MetaModuloResponse> actualizarMeta(
            @PathVariable String modulo,
            @RequestBody @Valid ActualizarMetaRequest body
    ) {
        return ResponseEntity.ok(metaCumplimientoService.actualizarMeta(modulo, body.getMetaValor()));
    }
}
