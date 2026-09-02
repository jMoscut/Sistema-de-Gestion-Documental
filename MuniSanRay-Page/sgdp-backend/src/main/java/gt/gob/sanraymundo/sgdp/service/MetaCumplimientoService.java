package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.response.MetaModuloResponse;
import gt.gob.sanraymundo.sgdp.model.entity.MetaCumplimiento;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.MetaCumplimientoRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetaCumplimientoService {

    private final MetaCumplimientoRepository metaRepository;
    private final CarpetaOficioRepository carpetaOficioRepository;
    private final DocumentoRepository documentoRepository;
    private final SolicitudRepository solicitudRepository;

    @Transactional(readOnly = true)
    public List<MetaModuloResponse> calcularMetas() {
        return metaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MetaModuloResponse actualizarMeta(String modulo, int nuevoValor) {
        MetaCumplimiento meta = metaRepository.findByModulo(modulo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Módulo no encontrado: " + modulo));
        meta.setMetaValor(nuevoValor);
        meta.setUpdatedAt(OffsetDateTime.now());
        return toResponse(metaRepository.save(meta));
    }

    private MetaModuloResponse toResponse(MetaCumplimiento m) {
        int actual = switch (m.getTipoMetrica()) {
            case "CATEGORIAS_CON_CONTENIDO" ->
                    (int) carpetaOficioRepository.countCategoriasConContenidoEnSeccion(m.getSeccion());
            case "TOTAL_DOCUMENTOS" ->
                    (int) documentoRepository.count();
            case "SOLICITUDES_RESPONDIDAS" ->
                    (int) solicitudRepository.countByEstado(EstadoSolicitud.RESPONDIDA);
            default -> 0;
        };
        int pct = m.getMetaValor() > 0 ? Math.min(100, actual * 100 / m.getMetaValor()) : 0;
        return MetaModuloResponse.builder()
                .modulo(m.getModulo())
                .etiqueta(m.getEtiqueta())
                .tipoMetrica(m.getTipoMetrica())
                .actual(actual)
                .meta(m.getMetaValor())
                .porcentaje(pct)
                .build();
    }
}
