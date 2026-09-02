package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.response.MetaModuloResponse;
import gt.gob.sanraymundo.sgdp.model.entity.MetaCumplimiento;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.MetaCumplimientoRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MetaCumplimientoServiceTest {

    @Mock private MetaCumplimientoRepository metaRepository;
    @Mock private CarpetaOficioRepository carpetaOficioRepository;
    @Mock private DocumentoRepository documentoRepository;
    @Mock private SolicitudRepository solicitudRepository;

    @InjectMocks
    private MetaCumplimientoService metaCumplimientoService;

    private MetaCumplimiento crearMeta(String modulo, String tipoMetrica, String seccion, int metaValor) {
        MetaCumplimiento m = new MetaCumplimiento();
        m.setId(1);
        m.setModulo(modulo);
        m.setEtiqueta("Etiqueta " + modulo);
        m.setTipoMetrica(tipoMetrica);
        m.setSeccion(seccion);
        m.setMetaValor(metaValor);
        return m;
    }

    @Test
    void calcularMetas_tipoCategoriasConContenido_calculaPorcentaje() {
        MetaCumplimiento meta = crearMeta("OFICIO", "CATEGORIAS_CON_CONTENIDO", "LAIP", 10);
        when(metaRepository.findAll()).thenReturn(List.of(meta));
        when(carpetaOficioRepository.countCategoriasConContenidoEnSeccion("LAIP")).thenReturn(5L);

        List<MetaModuloResponse> result = metaCumplimientoService.calcularMetas();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getActual()).isEqualTo(5);
        assertThat(result.get(0).getPorcentaje()).isEqualTo(50);
    }

    @Test
    void calcularMetas_tipoTotalDocumentos_usaConteoDocumentos() {
        MetaCumplimiento meta = crearMeta("DOCUMENTOS", "TOTAL_DOCUMENTOS", null, 100);
        when(metaRepository.findAll()).thenReturn(List.of(meta));
        when(documentoRepository.count()).thenReturn(80L);

        List<MetaModuloResponse> result = metaCumplimientoService.calcularMetas();

        assertThat(result.get(0).getActual()).isEqualTo(80);
        assertThat(result.get(0).getPorcentaje()).isEqualTo(80);
    }

    @Test
    void calcularMetas_tipoSolicitudesRespondidas_usaConteoSolicitudes() {
        MetaCumplimiento meta = crearMeta("SOLICITUDES", "SOLICITUDES_RESPONDIDAS", null, 20);
        when(metaRepository.findAll()).thenReturn(List.of(meta));
        when(solicitudRepository.countByEstado(EstadoSolicitud.RESPONDIDA)).thenReturn(25L);

        List<MetaModuloResponse> result = metaCumplimientoService.calcularMetas();

        // porcentaje se limita a 100 aunque el actual supere la meta
        assertThat(result.get(0).getActual()).isEqualTo(25);
        assertThat(result.get(0).getPorcentaje()).isEqualTo(100);
    }

    @Test
    void calcularMetas_tipoDesconocido_actualEsCero() {
        MetaCumplimiento meta = crearMeta("OTRO", "TIPO_INVALIDO", null, 10);
        when(metaRepository.findAll()).thenReturn(List.of(meta));

        List<MetaModuloResponse> result = metaCumplimientoService.calcularMetas();

        assertThat(result.get(0).getActual()).isEqualTo(0);
        assertThat(result.get(0).getPorcentaje()).isEqualTo(0);
    }

    @Test
    void calcularMetas_metaValorCero_porcentajeCero() {
        MetaCumplimiento meta = crearMeta("DOCUMENTOS", "TOTAL_DOCUMENTOS", null, 0);
        when(metaRepository.findAll()).thenReturn(List.of(meta));
        when(documentoRepository.count()).thenReturn(5L);

        List<MetaModuloResponse> result = metaCumplimientoService.calcularMetas();

        assertThat(result.get(0).getPorcentaje()).isEqualTo(0);
    }

    @Test
    void actualizarMeta_moduloNoExiste_lanzaExcepcion() {
        when(metaRepository.findByModulo("INEXISTENTE")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> metaCumplimientoService.actualizarMeta("INEXISTENTE", 50))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Módulo no encontrado");
    }

    @Test
    void actualizarMeta_moduloExiste_actualizaValor() {
        MetaCumplimiento meta = crearMeta("DOCUMENTOS", "TOTAL_DOCUMENTOS", null, 50);
        when(metaRepository.findByModulo("DOCUMENTOS")).thenReturn(Optional.of(meta));
        when(metaRepository.save(any(MetaCumplimiento.class))).thenAnswer(inv -> inv.getArgument(0));
        when(documentoRepository.count()).thenReturn(30L);

        MetaModuloResponse result = metaCumplimientoService.actualizarMeta("DOCUMENTOS", 150);

        assertThat(meta.getMetaValor()).isEqualTo(150);
        assertThat(meta.getUpdatedAt()).isNotNull();
        assertThat(result.getMeta()).isEqualTo(150);
    }
}
