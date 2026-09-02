package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.CrearCategoriaDocumentoRequest;
import gt.gob.sanraymundo.sgdp.dto.request.SubirDocumentoRequest;
import gt.gob.sanraymundo.sgdp.dto.response.CategoriaResponse;
import gt.gob.sanraymundo.sgdp.dto.response.DocumentoResponse;
import gt.gob.sanraymundo.sgdp.dto.response.VersionDocumentoResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.model.entity.CategoriaDocumento;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.SecuenciaCodigo;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.entity.VersionDocumento;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.CategoriaDocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoSpecifications;
import gt.gob.sanraymundo.sgdp.repository.SecuenciaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import gt.gob.sanraymundo.sgdp.repository.VersionDocumentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final CategoriaDocumentoRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final SecuenciaRepository secuenciaRepository;
    private final VersionDocumentoRepository versionDocumentoRepository;
    private final R2StorageService r2StorageService;
    private final HashService hashService;
    private final AuditoriaService auditoriaService;
    private final FileValidatorService fileValidatorService;

    // -------------------------------------------------------------------------
    // Subir documento
    // -------------------------------------------------------------------------

    @Transactional
    public DocumentoResponse subirDocumento(MultipartFile file,
                                            SubirDocumentoRequest req,
                                            String nombreUsuarioActor,
                                            String ip) {
        // 1. Resolver usuario
        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado"));

        // 2. Resolver categoría
        CategoriaDocumento categoria = categoriaRepository.findById(req.getCategoriaId())
                .orElseThrow(() -> new NegocioException("Categoría no encontrada"));

        // 3. Leer bytes, validar y calcular hash
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new NegocioException("No se pudo leer el archivo: " + e.getMessage());
        }

        fileValidatorService.validarDocumento(bytes, file.getContentType());

        String sha256 = hashService.sha256(bytes);

        // 4. Detectar duplicado por contenido
        if (documentoRepository.existsByHashSha256(sha256)) {
            throw new NegocioException("Ya existe un documento con contenido idéntico");
        }

        // 5. Generar código único
        String codigo = generarCodigoDocumento();

        // 6. Construir clave R2
        int anio = LocalDate.now().getYear();
        int mes  = LocalDate.now().getMonthValue();
        String r2Key = String.format("documentos/%d/%02d/%s/%s",
                anio, mes, codigo, file.getOriginalFilename());

        // 7. Subir a R2
        r2StorageService.upload(r2Key, bytes, file.getContentType());

        // 8. Persistir entidad
        NivelAcceso nivelAcceso = req.getNivelAcceso() != null ? req.getNivelAcceso() : NivelAcceso.INTERNO;

        Documento doc = Documento.builder()
                .codigo(codigo)
                .titulo(req.getTitulo())
                .descripcion(req.getDescripcion())
                .categoria(categoria)
                .unidadOrigen(req.getUnidadOrigen())
                .fechaEmision(req.getFechaEmision())
                .nivelAcceso(nivelAcceso)
                .r2Key(r2Key)
                .nombreArchivo(file.getOriginalFilename())
                .tamanoBytes((long) bytes.length)
                .hashSha256(sha256)
                .registradoPor(usuario)
                .build();

        doc = documentoRepository.save(doc);

        // 9. Auditoría
        auditoriaService.registrarExito(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                ip,
                TipoAccion.CREATE_DOC,
                "DOCUMENTO",
                doc.getId().toString(),
                doc.getCodigo()
        );

        return DocumentoResponse.from(doc);
    }

    // -------------------------------------------------------------------------
    // Búsqueda / listado
    // -------------------------------------------------------------------------

    public Page<DocumentoResponse> buscar(String q,
                                          String nivelAccesoStr,
                                          String estado,
                                          Pageable pageable) {
        Page<Documento> page;

        if (StringUtils.hasText(q)) {
            var spec = DocumentoSpecifications.and(
                    DocumentoSpecifications.texto(q),
                    DocumentoSpecifications.nivelAcceso(nivelAccesoStr),
                    DocumentoSpecifications.estado(StringUtils.hasText(estado) ? estado : "VIGENTE")
            );
            page = documentoRepository.findAll(spec, pageable);

        } else if (StringUtils.hasText(nivelAccesoStr) && StringUtils.hasText(estado)) {
            NivelAcceso nivel = NivelAcceso.valueOf(nivelAccesoStr.toUpperCase());
            page = documentoRepository.findByNivelAccesoAndEstado(nivel, estado, pageable);

        } else if (StringUtils.hasText(nivelAccesoStr)) {
            NivelAcceso nivel = NivelAcceso.valueOf(nivelAccesoStr.toUpperCase());
            page = documentoRepository.findByNivelAcceso(nivel, pageable);

        } else if (StringUtils.hasText(estado)) {
            page = documentoRepository.findByEstado(estado, pageable);

        } else {
            page = documentoRepository.findAll(pageable);
        }

        return page.map(DocumentoResponse::from);
    }

    // -------------------------------------------------------------------------
    // Obtener por ID
    // -------------------------------------------------------------------------

    public DocumentoResponse obtenerPorId(Long id) {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));
        return DocumentoResponse.from(doc);
    }

    // -------------------------------------------------------------------------
    // Metadata de documento para descarga (sin auditoría — solo nombre/tipo)
    // -------------------------------------------------------------------------

    public Documento prepararDescargaMetadata(Long id) {
        return documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));
    }

    // -------------------------------------------------------------------------
    // Descarga con verificación SHA-256
    // -------------------------------------------------------------------------

    @Transactional
    public byte[] descargarConVerificacion(Long id, String nombreUsuarioActor, String ip) {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado"));

        byte[] bytes = r2StorageService.downloadBytes(doc.getR2Key());
        String hashCalculado = hashService.sha256(bytes);

        if (!hashCalculado.equals(doc.getHashSha256())) {
            auditoriaService.registrarFallo(
                    usuario.getId(),
                    usuario.getCorreoElectronico(),
                    ip,
                    TipoAccion.INTEGRITY_FAIL,
                    "Fallo integridad SHA-256: doc=" + doc.getCodigo()
            );
            throw new NegocioException(
                    "Error de integridad: el archivo fue modificado en almacenamiento. " +
                    "Reporte este incidente al administrador.");
        }

        auditoriaService.registrarExito(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                ip,
                TipoAccion.DOWNLOAD_DOC,
                "DOCUMENTO",
                id.toString(),
                doc.getCodigo()
        );

        return bytes;
    }

    // -------------------------------------------------------------------------
    // Archivar documento (VIGENTE → ARCHIVADO)
    // -------------------------------------------------------------------------

    @Transactional
    public DocumentoResponse archivarDocumento(Long id, String nombreUsuarioActor, String ip) {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));

        if ("ARCHIVADO".equals(doc.getEstado())) {
            throw new NegocioException("El documento ya está archivado");
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado"));

        doc.setEstado("ARCHIVADO");
        doc = documentoRepository.save(doc);

        auditoriaService.registrarExito(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                ip,
                TipoAccion.ARCHIVE_DOC,
                "DOCUMENTO",
                doc.getId().toString(),
                "Archivado: " + doc.getCodigo()
        );

        return DocumentoResponse.from(doc);
    }

    // -------------------------------------------------------------------------
    // Reactivar documento (ARCHIVADO → VIGENTE)
    // -------------------------------------------------------------------------

    @Transactional
    public DocumentoResponse reactivarDocumento(Long id, String nombreUsuarioActor, String ip) {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));

        if (!"ARCHIVADO".equals(doc.getEstado())) {
            throw new NegocioException("Solo se pueden reactivar documentos archivados");
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado"));

        doc.setEstado("VIGENTE");
        doc = documentoRepository.save(doc);

        auditoriaService.registrarExito(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                ip,
                TipoAccion.REACTIVATE_DOC,
                "DOCUMENTO",
                doc.getId().toString(),
                "Reactivado: " + doc.getCodigo()
        );

        return DocumentoResponse.from(doc);
    }

    // -------------------------------------------------------------------------
    // Subir nueva versión de documento
    // -------------------------------------------------------------------------

    @Transactional
    public DocumentoResponse subirNuevaVersion(Long id, MultipartFile file,
                                               String motivoCambio,
                                               String nombreUsuarioActor, String ip) {
        Documento doc = documentoRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + id));

        if ("ARCHIVADO".equals(doc.getEstado())) {
            throw new NegocioException("No se puede versionar un documento archivado");
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado"));

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new NegocioException("No se pudo leer el archivo: " + e.getMessage());
        }

        fileValidatorService.validarDocumento(bytes, file.getContentType());

        String nuevoHash = hashService.sha256(bytes);

        // Guardar snapshot de la versión actual en versiones_documento
        VersionDocumento snapshot = VersionDocumento.builder()
                .documento(doc)
                .numeroVersion(doc.getVersionActual())
                .r2Key(doc.getR2Key())
                .hashSha256(doc.getHashSha256())
                .tamanoBytes(doc.getTamanoBytes())
                .motivoCambio(motivoCambio)
                .creadoPor(usuario)
                .build();
        versionDocumentoRepository.save(snapshot);

        // Subir nuevo archivo a R2
        int anio = LocalDate.now().getYear();
        int mes  = LocalDate.now().getMonthValue();
        String nuevoR2Key = String.format("documentos/%d/%02d/%s/v%d/%s",
                anio, mes, doc.getCodigo(), doc.getVersionActual() + 1, file.getOriginalFilename());
        r2StorageService.upload(nuevoR2Key, bytes, file.getContentType());

        // Actualizar documento con nuevo contenido
        doc.setR2Key(nuevoR2Key);
        doc.setHashSha256(nuevoHash);
        doc.setTamanoBytes((long) bytes.length);
        doc.setNombreArchivo(file.getOriginalFilename());
        doc.setVersionActual(doc.getVersionActual() + 1);
        doc = documentoRepository.save(doc);

        auditoriaService.registrarExito(
                usuario.getId(),
                usuario.getCorreoElectronico(),
                ip,
                TipoAccion.VERSION_DOC,
                "DOCUMENTO",
                doc.getId().toString(),
                "Nueva versión v" + doc.getVersionActual() + ": " + doc.getCodigo()
        );

        return DocumentoResponse.from(doc);
    }

    // -------------------------------------------------------------------------
    // Historial de versiones
    // -------------------------------------------------------------------------

    public List<VersionDocumentoResponse> listarVersiones(Long documentoId) {
        documentoRepository.findById(documentoId)
                .orElseThrow(() -> new NegocioException("Documento no encontrado con id: " + documentoId));
        return versionDocumentoRepository
                .findByDocumentoIdOrderByNumeroVersionDesc(documentoId)
                .stream()
                .map(VersionDocumentoResponse::from)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Listar categorías activas
    // -------------------------------------------------------------------------

    public List<CategoriaResponse> listarCategorias() {
        return categoriaRepository.findByActivaTrue()
                .stream()
                .map(CategoriaResponse::from)
                .toList();
    }

    @Transactional
    public CategoriaResponse crearCategoria(CrearCategoriaDocumentoRequest req) {
        String nombre = req.getNombre().trim();
        if (categoriaRepository.existsByNombre(nombre)) {
            throw new NegocioException("Ya existe una categoría con ese nombre");
        }
        CategoriaDocumento cat = CategoriaDocumento.builder()
                .nombre(nombre)
                .descripcion(req.getDescripcion())
                .esLaip(false)
                .activa(true)
                .build();
        return CategoriaResponse.from(categoriaRepository.save(cat));
    }

    @Transactional
    public CategoriaResponse actualizarCategoria(Long id, CrearCategoriaDocumentoRequest req) {
        CategoriaDocumento cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Categoría no encontrada"));
        String nombre = req.getNombre().trim();
        if (!nombre.equals(cat.getNombre()) && categoriaRepository.existsByNombre(nombre)) {
            throw new NegocioException("Ya existe una categoría con ese nombre");
        }
        cat.setNombre(nombre);
        cat.setDescripcion(req.getDescripcion());
        return CategoriaResponse.from(categoriaRepository.save(cat));
    }

    @Transactional
    public void eliminarCategoria(Long id) {
        CategoriaDocumento cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Categoría no encontrada"));
        if (documentoRepository.existsByCategoria(cat)) {
            throw new NegocioException("No se puede eliminar una categoría que tiene documentos asociados");
        }
        categoriaRepository.delete(cat);
    }

    // -------------------------------------------------------------------------
    // Helpers privados
    // -------------------------------------------------------------------------

    /**
     * Genera el próximo código de documento de forma segura usando bloqueo pesimista.
     * Formato: {PREFIJO}-{ANIO}-{NUMERO_4_DIGITOS}  ej: DOC-2026-0001
     */
    @Transactional
    public String generarCodigoDocumento() {
        SecuenciaCodigo seq = secuenciaRepository.findByTipoForUpdate("DOCUMENTO")
                .orElseThrow(() -> new NegocioException("Secuencia DOCUMENTO no configurada en la base de datos"));

        int anioActual = LocalDate.now().getYear();

        if (seq.getAnio() != anioActual) {
            seq.setUltimoNum(0);
            seq.setAnio(anioActual);
        }

        seq.setUltimoNum(seq.getUltimoNum() + 1);
        secuenciaRepository.save(seq);

        return String.format("%s-%d-%04d", seq.getPrefijo(), anioActual, seq.getUltimoNum());
    }

}
