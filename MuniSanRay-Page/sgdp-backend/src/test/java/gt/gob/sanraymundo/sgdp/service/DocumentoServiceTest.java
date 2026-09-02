package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.model.entity.CategoriaDocumento;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.SecuenciaCodigo;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.entity.VersionDocumento;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.CategoriaDocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.SecuenciaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.repository.VersionDocumentoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentoServiceTest {

    @Mock private DocumentoRepository documentoRepository;
    @Mock private CategoriaDocumentoRepository categoriaRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private SecuenciaRepository secuenciaRepository;
    @Mock private VersionDocumentoRepository versionDocumentoRepository;
    @Mock private R2StorageService r2StorageService;
    @Mock private HashService hashService;
    @Mock private AuditoriaService auditoriaService;
    @Mock private FileValidatorService fileValidatorService;

    @InjectMocks
    private DocumentoService documentoService;

    // ── descargarConVerificacion ──────────────────────────────────────────────

    @Test
    void descargarConVerificacion_hashCorrecto_retornaBytes() {
        byte[] contenido = "contenido-pdf".getBytes();
        Documento doc = crearDocumento("hash-correcto");
        Usuario user = crearUsuario("user@muni.gt");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(user));
        when(r2StorageService.downloadBytes("docs/test.pdf")).thenReturn(contenido);
        when(hashService.sha256(contenido)).thenReturn("hash-correcto");

        byte[] resultado = documentoService.descargarConVerificacion(1L, "user@muni.gt", "127.0.0.1");

        assertThat(resultado).isEqualTo(contenido);
    }

    @Test
    void descargarConVerificacion_hashIncorrecto_lanzaExcepcion() {
        byte[] contenidoAlterado = "contenido-alterado".getBytes();
        Documento doc = crearDocumento("hash-original");
        Usuario user = crearUsuario("user@muni.gt");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(user));
        when(r2StorageService.downloadBytes(any())).thenReturn(contenidoAlterado);
        when(hashService.sha256(contenidoAlterado)).thenReturn("hash-diferente");

        assertThatThrownBy(() ->
                documentoService.descargarConVerificacion(1L, "user@muni.gt", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("integridad");

        verify(auditoriaService).registrarFallo(
                any(), any(), any(),
                eq(TipoAccion.INTEGRITY_FAIL),
                any()
        );
    }

    @Test
    void descargarConVerificacion_documentoNoExiste_lanzaExcepcion() {
        when(documentoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                documentoService.descargarConVerificacion(99L, "user@muni.gt", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("no encontrado");
    }

    @Test
    void prepararDescargaMetadata_retornaDocumento() {
        Documento doc = crearDocumento("hash");
        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));

        Documento result = documentoService.prepararDescargaMetadata(1L);

        assertThat(result.getR2Key()).isEqualTo("docs/test.pdf");
    }

    // ── archivarDocumento ─────────────────────────────────────────────────────

    @Test
    void archivarDocumento_estadoVigente_cambiaAArchivado() {
        Documento doc = crearDocumento("hash");
        doc.setEstado("VIGENTE");
        Usuario user = crearUsuario("admin@muni.gt");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(usuarioRepository.findByNombreUsuario("admin@muni.gt")).thenReturn(Optional.of(user));
        when(documentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = documentoService.archivarDocumento(1L, "admin@muni.gt", "127.0.0.1");

        assertThat(resp.getEstado()).isEqualTo("ARCHIVADO");
    }

    @Test
    void archivarDocumento_yaArchivado_lanzaExcepcion() {
        Documento doc = crearDocumento("hash");
        doc.setEstado("ARCHIVADO");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));

        assertThatThrownBy(() -> documentoService.archivarDocumento(1L, "admin@muni.gt", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("archivado");
    }

    // ── reactivarDocumento ────────────────────────────────────────────────────

    @Test
    void reactivarDocumento_estadoArchivado_cambiaAVigente() {
        Documento doc = crearDocumento("hash");
        doc.setEstado("ARCHIVADO");
        Usuario user = crearUsuario("admin@muni.gt");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));
        when(usuarioRepository.findByNombreUsuario("admin@muni.gt")).thenReturn(Optional.of(user));
        when(documentoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var resp = documentoService.reactivarDocumento(1L, "admin@muni.gt", "127.0.0.1");

        assertThat(resp.getEstado()).isEqualTo("VIGENTE");
    }

    @Test
    void reactivarDocumento_estadoVigente_lanzaExcepcion() {
        Documento doc = crearDocumento("hash");
        doc.setEstado("VIGENTE");

        when(documentoRepository.findById(1L)).thenReturn(Optional.of(doc));

        assertThatThrownBy(() -> documentoService.reactivarDocumento(1L, "admin@muni.gt", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("archivados");
    }

    // ── generarCodigoDocumento ────────────────────────────────────────────────

    @Test
    void generarCodigoDocumento_secuenciaAumentaUno() {
        SecuenciaCodigo seq = SecuenciaCodigo.builder()
                .tipo("DOCUMENTO").prefijo("DOC")
                .anio(LocalDate.now().getYear()).ultimoNum(5)
                .build();

        when(secuenciaRepository.findByTipoForUpdate("DOCUMENTO")).thenReturn(Optional.of(seq));
        when(secuenciaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String codigo = documentoService.generarCodigoDocumento();

        assertThat(codigo).startsWith("DOC-").contains(String.valueOf(LocalDate.now().getYear()));
        assertThat(seq.getUltimoNum()).isEqualTo(6);
    }

    @Test
    void generarCodigoDocumento_secuenciaSinConfigurar_lanzaExcepcion() {
        when(secuenciaRepository.findByTipoForUpdate("DOCUMENTO")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentoService.generarCodigoDocumento())
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Secuencia");
    }

    // ── subirDocumento ────────────────────────────────────────────────────────

    @Test
    void subirDocumento_duplicadoPorHash_lanzaExcepcion() {
        byte[] bytes = "contenido".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", bytes);
        CategoriaDocumento cat = CategoriaDocumento.builder().id(1L).nombre("Test").build();
        Usuario user = crearUsuario("user@muni.gt");

        var req = new gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoRequest();
        req.setCategoriaId(1L);
        req.setTitulo("Doc de prueba");

        when(usuarioRepository.findByNombreUsuario("user@muni.gt")).thenReturn(Optional.of(user));
        when(categoriaRepository.findById(1L)).thenReturn(Optional.of(cat));
        when(hashService.sha256(bytes)).thenReturn("hash-existente");
        when(documentoRepository.existsByHashSha256("hash-existente")).thenReturn(true);

        assertThatThrownBy(() -> documentoService.subirDocumento(file, req, "user@muni.gt", "127.0.0.1"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("idéntico");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Documento crearDocumento(String hash) {
        Documento d = Documento.builder()
                .id(1L)
                .codigo("DOC-2026-0001")
                .r2Key("docs/test.pdf")
                .nombreArchivo("test.pdf")
                .hashSha256(hash)
                .nivelAcceso(NivelAcceso.PUBLICO)
                .build();
        d.setEstado("VIGENTE");
        return d;
    }

    private Usuario crearUsuario(String nombreUsuario) {
        return Usuario.builder()
                .id(1L)
                .nombreUsuario(nombreUsuario)
                .nombreCompleto("Test User")
                .rol(RolUsuario.FUNCIONARIO)
                .activo(true)
                .build();
    }
}
