package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.CrearCarpetaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearCategoriaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CarpetaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoOficioResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.CategoriaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.CategoriaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoOficioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OficioAdminServiceTest {

    @Mock private CategoriaOficioRepository categoriaRepo;
    @Mock private CarpetaOficioRepository carpetaRepo;
    @Mock private DocumentoOficioRepository documentoRepo;
    @Mock private R2StorageService r2StorageService;
    @Mock private HashService hashService;
    @Mock private FileValidatorService fileValidatorService;

    @InjectMocks
    private OficioAdminService oficioAdminService;

    private CategoriaOficio crearCategoria() {
        CategoriaOficio cat = new CategoriaOficio();
        cat.setId(1);
        cat.setSeccion("LAIP");
        cat.setNumero((short) 1);
        cat.setNombre("Estructura Orgánica");
        return cat;
    }

    private CarpetaOficio crearCarpeta(CategoriaOficio categoria) {
        return CarpetaOficio.builder()
                .id(10L)
                .categoria(categoria)
                .nombre("Carpeta 2026")
                .descripcion("Descripción")
                .build();
    }

    private Usuario crearUsuario() {
        return Usuario.builder()
                .id(1L)
                .nombreUsuario("admin1")
                .nombreCompleto("Admin Uno")
                .rol(RolUsuario.ADMINISTRADOR)
                .build();
    }

    // ── Categorías ────────────────────────────────────────────────────────────

    @Test
    void listarCategorias_retornaListaMapeada() {
        CategoriaOficio cat = crearCategoria();
        when(categoriaRepo.findBySeccionOrderByNumeroAsc("LAIP")).thenReturn(List.of(cat));
        when(carpetaRepo.countByCategoriaId(1)).thenReturn(3L);

        List<CategoriaOficioResponse> result = oficioAdminService.listarCategorias("LAIP");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNombre()).isEqualTo("Estructura Orgánica");
        assertThat(result.get(0).getTotalCarpetas()).isEqualTo(3L);
    }

    @Test
    void crearCategoria_asignaSiguienteNumero() {
        CrearCategoriaOficioRequest req = new CrearCategoriaOficioRequest();
        req.setSeccion("laip");
        req.setNombre("Nueva Categoría");

        when(categoriaRepo.findMaxNumeroBySeccion("laip")).thenReturn((short) 4);
        when(categoriaRepo.save(any(CategoriaOficio.class))).thenAnswer(inv -> {
            CategoriaOficio c = inv.getArgument(0);
            c.setId(5);
            return c;
        });

        CategoriaOficioResponse result = oficioAdminService.crearCategoria(req);

        assertThat(result.getNumero()).isEqualTo((short) 5);
        assertThat(result.getSeccion()).isEqualTo("LAIP");
        assertThat(result.getNombre()).isEqualTo("Nueva Categoría");
    }

    @Test
    void actualizarCategoria_noExiste_lanzaExcepcion() {
        when(categoriaRepo.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> oficioAdminService.actualizarCategoria(99, "X"))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void eliminarCategoria_conCarpetas_lanzaExcepcion() {
        CategoriaOficio cat = crearCategoria();
        when(categoriaRepo.findById(1)).thenReturn(Optional.of(cat));
        when(carpetaRepo.countByCategoriaId(1)).thenReturn(2L);

        assertThatThrownBy(() -> oficioAdminService.eliminarCategoria(1))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("No se puede eliminar");

        verify(categoriaRepo, never()).delete(any());
    }

    @Test
    void eliminarCategoria_sinCarpetas_eliminaCorrectamente() {
        CategoriaOficio cat = crearCategoria();
        when(categoriaRepo.findById(1)).thenReturn(Optional.of(cat));
        when(carpetaRepo.countByCategoriaId(1)).thenReturn(0L);

        oficioAdminService.eliminarCategoria(1);

        verify(categoriaRepo).delete(cat);
    }

    // ── Carpetas ──────────────────────────────────────────────────────────────

    @Test
    void crearCarpeta_categoriaNoExiste_lanzaExcepcion() {
        CrearCarpetaOficioRequest req = new CrearCarpetaOficioRequest();
        req.setNombre("Carpeta");
        when(categoriaRepo.findById(1)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> oficioAdminService.crearCarpeta(1, req, crearUsuario()))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void crearCarpeta_categoriaExiste_creaCorrectamente() {
        CategoriaOficio cat = crearCategoria();
        CrearCarpetaOficioRequest req = new CrearCarpetaOficioRequest();
        req.setNombre("Carpeta Nueva");
        req.setDescripcion("Desc");

        when(categoriaRepo.findById(1)).thenReturn(Optional.of(cat));
        when(carpetaRepo.save(any(CarpetaOficio.class))).thenAnswer(inv -> inv.getArgument(0));
        when(documentoRepo.countByCarpetaId(any())).thenReturn(0L);

        CarpetaOficioResponse result = oficioAdminService.crearCarpeta(1, req, crearUsuario());

        assertThat(result.getNombre()).isEqualTo("Carpeta Nueva");
        assertThat(result.getCategoriaNombre()).isEqualTo("Estructura Orgánica");
    }

    @Test
    void eliminarCarpeta_borraArchivosR2YRegistro() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).carpeta(carpeta).archivoR2Key("key1").build();

        when(carpetaRepo.findById(10L)).thenReturn(Optional.of(carpeta));
        when(documentoRepo.findByCarpetaIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(doc));

        oficioAdminService.eliminarCarpeta(10L);

        verify(r2StorageService).delete("key1");
        verify(carpetaRepo).delete(carpeta);
    }

    @Test
    void eliminarCarpeta_noExiste_lanzaExcepcion() {
        when(carpetaRepo.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> oficioAdminService.eliminarCarpeta(999L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    // ── Documentos ────────────────────────────────────────────────────────────

    @Test
    void subirDocumento_carpetaNoExiste_lanzaExcepcion() {
        SubirDocumentoOficioRequest req = new SubirDocumentoOficioRequest();
        req.setTitulo("Doc");
        when(carpetaRepo.findById(10L)).thenReturn(Optional.empty());

        MockMultipartFile archivo = new MockMultipartFile("archivo", "doc.pdf", "application/pdf", "contenido".getBytes());

        assertThatThrownBy(() -> oficioAdminService.subirDocumento(10L, req, archivo, crearUsuario()))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void subirDocumento_contenidoDuplicado_lanzaExcepcion() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        SubirDocumentoOficioRequest req = new SubirDocumentoOficioRequest();
        req.setTitulo("Doc");

        MockMultipartFile archivo = new MockMultipartFile("archivo", "doc.pdf", "application/pdf", "contenido".getBytes());

        when(carpetaRepo.findById(10L)).thenReturn(Optional.of(carpeta));
        when(hashService.sha256(any())).thenReturn("hash123");
        when(documentoRepo.existsByHashSha256("hash123")).thenReturn(true);

        assertThatThrownBy(() -> oficioAdminService.subirDocumento(10L, req, archivo, crearUsuario()))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("idéntico");

        verify(documentoRepo, never()).save(any());
    }

    @Test
    void subirDocumento_exitoso_guardaDocumento() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        SubirDocumentoOficioRequest req = new SubirDocumentoOficioRequest();
        req.setTitulo("Doc Nuevo");
        req.setDescripcion("Desc");

        MockMultipartFile archivo = new MockMultipartFile("archivo", "doc.pdf", "application/pdf", "contenido".getBytes());

        when(carpetaRepo.findById(10L)).thenReturn(Optional.of(carpeta));
        when(hashService.sha256(any())).thenReturn("hashUnico");
        when(documentoRepo.existsByHashSha256("hashUnico")).thenReturn(false);
        when(documentoRepo.save(any(DocumentoOficio.class))).thenAnswer(inv -> inv.getArgument(0));

        DocumentoOficioResponse result = oficioAdminService.subirDocumento(10L, req, archivo, crearUsuario());

        assertThat(result.getTitulo()).isEqualTo("Doc Nuevo");
        verify(r2StorageService).upload(anyString(), any(byte[].class), eq("application/pdf"));
    }

    @Test
    void eliminarDocumento_noExiste_lanzaExcepcion() {
        when(documentoRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> oficioAdminService.eliminarDocumento(1L))
                .isInstanceOf(RecursoNoEncontradoException.class);
    }

    @Test
    void eliminarDocumento_exitoso_borraArchivoYRegistro() {
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).archivoR2Key("key-x").build();
        when(documentoRepo.findById(1L)).thenReturn(Optional.of(doc));

        oficioAdminService.eliminarDocumento(1L);

        verify(r2StorageService).delete("key-x");
        verify(documentoRepo).delete(doc);
    }

    @Test
    void obtenerDocumentoEntidad_existente_retornaEntidad() {
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).titulo("Doc").build();
        when(documentoRepo.findById(1L)).thenReturn(Optional.of(doc));

        DocumentoOficio result = oficioAdminService.obtenerDocumentoEntidad(1L);

        assertThat(result.getTitulo()).isEqualTo("Doc");
    }

    @Test
    void listarDocumentos_retornaListaMapeada() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).carpeta(carpeta).titulo("Doc").archivoNombre("a.pdf").build();

        when(documentoRepo.findByCarpetaIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(doc));

        List<DocumentoOficioResponse> result = oficioAdminService.listarDocumentos(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitulo()).isEqualTo("Doc");
    }

    @Test
    void listarTodosDocumentos_retornaListaOrdenada() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).carpeta(carpeta).titulo("A Doc").build();

        when(documentoRepo.findAllByOrderByTituloAsc()).thenReturn(List.of(doc));

        assertThat(oficioAdminService.listarTodosDocumentos()).hasSize(1);
    }

    // ── Búsqueda ──────────────────────────────────────────────────────────────

    @Test
    void buscar_combinaCarpetasYDocumentos() {
        CategoriaOficio cat = crearCategoria();
        CarpetaOficio carpeta = crearCarpeta(cat);
        DocumentoOficio doc = DocumentoOficio.builder().id(1L).carpeta(carpeta).titulo("Doc").archivoNombre("a.pdf").build();

        when(carpetaRepo.buscarPorTexto("texto", "LAIP")).thenReturn(List.of(carpeta));
        when(documentoRepo.buscarPorTexto(eq("texto"), eq("LAIP"), any())).thenReturn(List.of(doc));

        var result = oficioAdminService.buscar("texto", "LAIP");

        assertThat(result).hasSize(2);
        assertThat(result).extracting("tipo").containsExactlyInAnyOrder("CARPETA", "DOCUMENTO");
    }

    @Test
    void buscar_sinResultados_retornaListaVacia() {
        when(carpetaRepo.buscarPorTexto(anyString(), anyString())).thenReturn(List.of());
        when(documentoRepo.buscarPorTexto(anyString(), anyString(), any())).thenReturn(List.of());

        assertThat(oficioAdminService.buscar("nada", "LAIP")).isEmpty();
    }
}
