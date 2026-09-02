package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.CrearCarpetaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearCategoriaOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoOficioRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CarpetaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoOficioResponse;
import gt.gob.sanraymundo.sgdp.dto.response.OficioBusquedaResultado;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.CarpetaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.CategoriaOficio;
import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.repository.CarpetaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.CategoriaOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoOficioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OficioAdminService {

    private final CategoriaOficioRepository categoriaRepo;
    private final CarpetaOficioRepository carpetaRepo;
    private final DocumentoOficioRepository documentoRepo;
    private final R2StorageService r2StorageService;
    private final HashService hashService;
    private final FileValidatorService fileValidatorService;

    // ── Categorías ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CategoriaOficioResponse> listarCategorias(String seccion) {
        return categoriaRepo.findBySeccionOrderByNumeroAsc(seccion).stream()
                .map(cat -> CategoriaOficioResponse.builder()
                        .id(cat.getId())
                        .seccion(cat.getSeccion())
                        .numero(cat.getNumero())
                        .nombre(cat.getNombre())
                        .totalCarpetas(carpetaRepo.countByCategoriaId(cat.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoriaOficioResponse crearCategoria(CrearCategoriaOficioRequest req) {
        short siguiente = (short) (categoriaRepo.findMaxNumeroBySeccion(req.getSeccion()) + 1);
        CategoriaOficio cat = new CategoriaOficio();
        cat.setSeccion(req.getSeccion().toUpperCase());
        cat.setNumero(siguiente);
        cat.setNombre(req.getNombre().trim());
        CategoriaOficio saved = categoriaRepo.save(cat);
        return CategoriaOficioResponse.builder()
                .id(saved.getId())
                .seccion(saved.getSeccion())
                .numero(saved.getNumero())
                .nombre(saved.getNombre())
                .totalCarpetas(0)
                .build();
    }

    @Transactional
    public CategoriaOficioResponse actualizarCategoria(Integer id, String nuevoNombre) {
        CategoriaOficio cat = categoriaRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("CategoriaOficio", "id", id.toString()));
        cat.setNombre(nuevoNombre.trim());
        CategoriaOficio saved = categoriaRepo.save(cat);
        return CategoriaOficioResponse.builder()
                .id(saved.getId())
                .seccion(saved.getSeccion())
                .numero(saved.getNumero())
                .nombre(saved.getNombre())
                .totalCarpetas(carpetaRepo.countByCategoriaId(saved.getId()))
                .build();
    }

    @Transactional
    public void eliminarCategoria(Integer id) {
        CategoriaOficio cat = categoriaRepo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("CategoriaOficio", "id", id.toString()));
        if (carpetaRepo.countByCategoriaId(id) > 0) {
            throw new NegocioException("No se puede eliminar una categoría que contiene carpetas");
        }
        categoriaRepo.delete(cat);
    }

    // ── Carpetas ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CarpetaOficioResponse> listarCarpetas(Integer categoriaId) {
        return carpetaRepo.findByCategoriaIdOrderByCreatedAtDesc(categoriaId).stream()
                .map(this::toCarpetaResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CarpetaOficioResponse crearCarpeta(Integer categoriaId, CrearCarpetaOficioRequest request, Usuario creador) {
        CategoriaOficio categoria = categoriaRepo.findById(categoriaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("CategoriaOficio", "id", categoriaId.toString()));

        CarpetaOficio carpeta = CarpetaOficio.builder()
                .categoria(categoria)
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .creadoPor(creador)
                .build();

        return toCarpetaResponse(carpetaRepo.save(carpeta));
    }

    @Transactional
    public CarpetaOficioResponse actualizarCarpeta(Long carpetaId, CrearCarpetaOficioRequest request) {
        CarpetaOficio carpeta = carpetaRepo.findById(carpetaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("CarpetaOficio", "id", carpetaId.toString()));
        carpeta.setNombre(request.getNombre());
        carpeta.setDescripcion(request.getDescripcion());
        return toCarpetaResponse(carpetaRepo.save(carpeta));
    }

    @Transactional
    public void eliminarCarpeta(Long carpetaId) {
        CarpetaOficio carpeta = carpetaRepo.findById(carpetaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("CarpetaOficio", "id", carpetaId.toString()));
        documentoRepo.findByCarpetaIdOrderByCreatedAtDesc(carpetaId).forEach(doc -> {
            try { r2StorageService.delete(doc.getArchivoR2Key()); } catch (Exception ignored) {}
        });
        carpetaRepo.delete(carpeta);
    }

    // ── Documentos ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentoOficioResponse> listarDocumentos(Long carpetaId) {
        return documentoRepo.findByCarpetaIdOrderByCreatedAtDesc(carpetaId).stream()
                .map(this::toDocumentoResponse)
                .collect(Collectors.toList());
    }

    /** Todos los documentos de Información de Oficio (LAIP) — todos públicos por naturaleza. */
    @Transactional(readOnly = true)
    public List<DocumentoOficioResponse> listarTodosDocumentos() {
        return documentoRepo.findAllByOrderByTituloAsc().stream()
                .map(this::toDocumentoResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentoOficioResponse subirDocumento(Long carpetaId, SubirDocumentoOficioRequest request, MultipartFile archivo, Usuario subidoPor) {
        CarpetaOficio carpeta = carpetaRepo.findById(carpetaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("CarpetaOficio", "id", carpetaId.toString()));

        byte[] bytes;
        try {
            bytes = archivo == null ? new byte[0] : archivo.getBytes();
        } catch (IOException e) {
            throw new NegocioException("Error al leer el archivo: " + e.getMessage());
        }

        fileValidatorService.validarOficioPdf(bytes, archivo != null ? archivo.getContentType() : null);

        String ct = archivo.getContentType();
        String r2Key = "oficio/docs/" + UUID.randomUUID() + ".pdf";
        r2StorageService.upload(r2Key, bytes, ct);

        String sha256 = hashService.sha256(bytes);

        if (documentoRepo.existsByHashSha256(sha256)) {
            throw new NegocioException("Ya existe un documento con contenido idéntico");
        }

        DocumentoOficio doc = DocumentoOficio.builder()
                .carpeta(carpeta)
                .titulo(request.getTitulo())
                .descripcion(request.getDescripcion())
                .archivoR2Key(r2Key)
                .archivoNombre(archivo.getOriginalFilename())
                .tamanoBytes(archivo.getSize())
                .hashSha256(sha256)
                .subidoPor(subidoPor)
                .build();

        return toDocumentoResponse(documentoRepo.save(doc));
    }

    @Transactional
    public void eliminarDocumento(Long docId) {
        DocumentoOficio doc = documentoRepo.findById(docId)
                .orElseThrow(() -> new RecursoNoEncontradoException("DocumentoOficio", "id", docId.toString()));
        try { r2StorageService.delete(doc.getArchivoR2Key()); } catch (Exception ignored) {}
        documentoRepo.delete(doc);
    }

    @Transactional(readOnly = true)
    public DocumentoOficio obtenerDocumentoEntidad(Long docId) {
        return documentoRepo.findById(docId)
                .orElseThrow(() -> new RecursoNoEncontradoException("DocumentoOficio", "id", docId.toString()));
    }

    // ── Búsqueda ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OficioBusquedaResultado> buscar(String q, String seccion) {
        List<OficioBusquedaResultado> resultados = new ArrayList<>();

        carpetaRepo.buscarPorTexto(q, seccion).forEach(c ->
                resultados.add(OficioBusquedaResultado.builder()
                        .tipo("CARPETA")
                        .categoriaId((long) c.getCategoria().getId())
                        .categoriaNumero(c.getCategoria().getNumero().intValue())
                        .categoriaNombre(c.getCategoria().getNombre())
                        .carpetaId(c.getId())
                        .carpetaNombre(c.getNombre())
                        .build()));

        documentoRepo.buscarPorTexto(q, seccion, PageRequest.of(0, 40)).forEach(d ->
                resultados.add(OficioBusquedaResultado.builder()
                        .tipo("DOCUMENTO")
                        .categoriaId((long) d.getCarpeta().getCategoria().getId())
                        .categoriaNumero(d.getCarpeta().getCategoria().getNumero().intValue())
                        .categoriaNombre(d.getCarpeta().getCategoria().getNombre())
                        .carpetaId(d.getCarpeta().getId())
                        .carpetaNombre(d.getCarpeta().getNombre())
                        .documentoId(d.getId())
                        .documentoTitulo(d.getTitulo())
                        .documentoArchivoNombre(d.getArchivoNombre())
                        .build()));

        return resultados;
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private CarpetaOficioResponse toCarpetaResponse(CarpetaOficio c) {
        return CarpetaOficioResponse.builder()
                .id(c.getId())
                .categoriaId(c.getCategoria().getId())
                .categoriaNombre(c.getCategoria().getNombre())
                .nombre(c.getNombre())
                .descripcion(c.getDescripcion())
                .totalDocumentos(documentoRepo.countByCarpetaId(c.getId()))
                .creadoPorNombre(c.getCreadoPor() != null ? c.getCreadoPor().getNombreCompleto() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private DocumentoOficioResponse toDocumentoResponse(DocumentoOficio d) {
        return DocumentoOficioResponse.builder()
                .id(d.getId())
                .carpetaId(d.getCarpeta().getId())
                .titulo(d.getTitulo())
                .descripcion(d.getDescripcion())
                .archivoNombre(d.getArchivoNombre())
                .tamanoBytes(d.getTamanoBytes())
                .subidoPorNombre(d.getSubidoPor() != null ? d.getSubidoPor().getNombreCompleto() : null)
                .createdAt(d.getCreatedAt())
                .build();
    }
}
