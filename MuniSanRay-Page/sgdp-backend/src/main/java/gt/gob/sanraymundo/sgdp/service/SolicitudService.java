package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.DenegarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.PresentarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ProrrogarSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResponderSolicitudRequest;
import gt.gob.sanraymundo.sgdp.dto.response.OficialResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SeguimientoResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudAdminResponse;
import gt.gob.sanraymundo.sgdp.dto.response.SolicitudPublicaResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.exception.RecursoNoEncontradoException;
import gt.gob.sanraymundo.sgdp.model.entity.Documento;
import gt.gob.sanraymundo.sgdp.model.entity.DocumentoOficio;
import gt.gob.sanraymundo.sgdp.model.entity.SecuenciaCodigo;
import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import gt.gob.sanraymundo.sgdp.model.enums.NivelAcceso;
import gt.gob.sanraymundo.sgdp.model.enums.RolUsuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.DocumentoOficioRepository;
import gt.gob.sanraymundo.sgdp.repository.DocumentoRepository;
import gt.gob.sanraymundo.sgdp.repository.SecuenciaRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudRepository;
import gt.gob.sanraymundo.sgdp.repository.SolicitudSpecifications;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SolicitudService {

    private final SolicitudRepository solicitudRepository;
    private final SecuenciaRepository secuenciaRepository;
    private final DiasHabilesService diasHabilesService;
    private final EmailService emailService;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;
    private final DocumentoRepository documentoRepository;
    private final DocumentoOficioRepository documentoOficioRepository;

    /**
     * Presenta una nueva solicitud de información pública (acceso anónimo).
     * Genera el código de expediente, calcula la fecha límite (10 días hábiles),
     * persiste la solicitud, envía correo de confirmación (async) y registra auditoría.
     */
    @Transactional
    public SolicitudPublicaResponse presentarSolicitud(PresentarSolicitudRequest request, String ipOrigen) {

        // 1. Generar código de expediente con bloqueo pesimista para evitar colisiones
        String codigoExpediente = generarCodigoExpediente();

        // 2. Calcular fecha límite = hoy + 10 días hábiles
        LocalDate hoy = LocalDate.now();
        LocalDate fechaLimite = diasHabilesService.calcularFechaLimite(hoy, 10);

        // 3. Construir y persistir la solicitud
        SolicitudInformacion solicitud = SolicitudInformacion.builder()
                .codigoExpediente(codigoExpediente)
                .nombreSolicitante(request.getNombreSolicitante())
                .dpiSolicitante(request.getDpiSolicitante())
                .correoSolicitante(request.getCorreoSolicitante())
                .telefonoSolicitante(request.getTelefonoSolicitante())
                .descripcionSolicitud(request.getDescripcionSolicitud())
                .fechaRecepcion(hoy)
                .fechaLimite(fechaLimite)
                .estado(EstadoSolicitud.PENDIENTE)
                .build();

        solicitudRepository.save(solicitud);
        log.info("Solicitud creada: {} - solicitante: {}", codigoExpediente, request.getNombreSolicitante());

        // 4. Enviar correo de confirmación de forma asíncrona (si se proporcionó correo)
        if (request.getCorreoSolicitante() != null && !request.getCorreoSolicitante().isBlank()) {
            emailService.enviarConfirmacionSolicitud(
                    request.getCorreoSolicitante(),
                    request.getNombreSolicitante(),
                    codigoExpediente,
                    fechaLimite,
                    request.getDescripcionSolicitud()
            );
        }

        // 5. Registrar en auditoría (anónimo, acción pública)
        auditoriaService.registrar(
                null,
                "PÚBLICO - " + request.getNombreSolicitante(),
                ipOrigen,
                TipoAccion.CREATE_SOL,
                "SOLICITUD",
                codigoExpediente,
                "Nueva solicitud presentada por " + request.getNombreSolicitante(),
                "EXITO",
                Map.of(
                    "codigoExpediente", codigoExpediente,
                    "fechaLimite", fechaLimite.toString()
                )
        );

        // 6. Retornar respuesta pública
        return SolicitudPublicaResponse.builder()
                .codigoExpediente(codigoExpediente)
                .fechaRecepcion(hoy)
                .fechaLimite(fechaLimite)
                .estado(EstadoSolicitud.PENDIENTE.name())
                .mensaje("Su solicitud ha sido registrada correctamente. " +
                         "Guarde su código de expediente para dar seguimiento.")
                .build();
    }

    /**
     * Consulta el estado de una solicitud por código de expediente (acceso anónimo).
     * Solo expone información pública segura, sin datos internos.
     */
    @Transactional(readOnly = true)
    public SeguimientoResponse consultarSeguimiento(String codigoExpediente) {
        SolicitudInformacion solicitud = solicitudRepository
                .findByCodigoExpediente(codigoExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Solicitud", "codigoExpediente", codigoExpediente));

        return SeguimientoResponse.builder()
                .codigoExpediente(solicitud.getCodigoExpediente())
                .nombreSolicitante(solicitud.getNombreSolicitante())
                .fechaRecepcion(solicitud.getFechaRecepcion())
                .fechaLimite(solicitud.getFechaLimite())
                .estado(solicitud.getEstado().name())
                .fechaProrroga(solicitud.getFechaProrroga())
                .fechaRespuesta(solicitud.getFechaRespuesta())
                .build();
    }

    // =========================================================================
    // Admin methods (Phase 4)
    // =========================================================================

    /**
     * Lista solicitudes paginadas, opcionalmente filtradas por estado y/o texto libre.
     * El estado VENCIDA es computado (fechaLimite <= hoy AND no terminal);
     * los estados activos excluyen registros ya vencidos.
     * La búsqueda de texto es por subcadena (no requiere coincidencia de palabra completa)
     * sobre código de expediente, solicitante, DPI, correo y descripción.
     */
    @Transactional(readOnly = true)
    public Page<SolicitudAdminResponse> listar(String estadoStr, String q, Pageable pageable) {
        var spec = SolicitudSpecifications.and(
                SolicitudSpecifications.estado(estadoStr, LocalDate.now()),
                SolicitudSpecifications.texto(q)
        );
        return solicitudRepository.findAll(spec, pageable).map(SolicitudAdminResponse::from);
    }

    /**
     * Devuelve el detalle completo de una solicitud.
     */
    @Transactional(readOnly = true)
    public SolicitudAdminResponse obtenerDetalle(Long id) {
        SolicitudInformacion solicitud = solicitudRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud", id));
        return SolicitudAdminResponse.from(solicitud);
    }

    /**
     * Lista todos los usuarios con rol OFICIAL activos.
     */
    @Transactional(readOnly = true)
    public List<OficialResponse> listarOficiales() {
        return usuarioRepository.findByRolAndActivoTrue(RolUsuario.OFICIAL)
                .stream()
                .map(OficialResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Asigna un oficial a una solicitud y la pone EN_PROCESO si estaba PENDIENTE.
     */
    @Transactional
    public SolicitudAdminResponse asignarOficial(Long solicitudId, Long oficialId,
                                                  String nombreUsuarioAdmin, String ip) {
        SolicitudInformacion solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud", solicitudId));

        EstadoSolicitud estadoActual = solicitud.getEstado();
        if (estadoActual != EstadoSolicitud.PENDIENTE && estadoActual != EstadoSolicitud.EN_PROCESO
                && estadoActual != EstadoSolicitud.VENCIDA) {
            throw new NegocioException("No se puede asignar oficial a una solicitud en estado: " + estadoActual.name());
        }
        if (solicitud.getOficialAsignado() != null) {
            throw new NegocioException("La solicitud ya tiene un oficial asignado");
        }

        Usuario admin = usuarioRepository.findByNombreUsuario(nombreUsuarioAdmin)
                .orElseThrow(() -> new NegocioException("Usuario actor no encontrado"));
        if (admin.getRol() == RolUsuario.OFICIAL && !admin.getId().equals(oficialId)) {
            throw new NegocioException("Un oficial solo puede asignarse la solicitud a sí mismo");
        }

        Usuario oficial = usuarioRepository.findById(oficialId)
                .orElseThrow(() -> new NegocioException("Oficial no encontrado con id: " + oficialId));
        if (oficial.getRol() != RolUsuario.OFICIAL) {
            throw new NegocioException("El usuario indicado no tiene rol OFICIAL");
        }

        solicitud.setOficialAsignado(oficial);
        if (estadoActual == EstadoSolicitud.PENDIENTE || estadoActual == EstadoSolicitud.VENCIDA) {
            solicitud.setEstado(EstadoSolicitud.EN_PROCESO);
        }

        SolicitudInformacion saved = solicitudRepository.save(solicitud);

        Long adminId = admin.getId();
        auditoriaService.registrarExito(adminId, nombreUsuarioAdmin, ip,
                TipoAccion.ASSIGN_SOL, "SOLICITUD",
                saved.getCodigoExpediente(),
                "Oficial asignado: " + oficial.getNombreCompleto());

        return SolicitudAdminResponse.from(saved);
    }

    /**
     * Prorroga una solicitud 10 días hábiles adicionales desde la fecha límite actual.
     */
    @Transactional
    public SolicitudAdminResponse prorrogar(Long solicitudId, ProrrogarSolicitudRequest req,
                                             String nombreUsuarioActor, String ip) {
        SolicitudInformacion solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud", solicitudId));

        EstadoSolicitud estadoActual = solicitud.getEstado();
        if (estadoActual != EstadoSolicitud.PENDIENTE && estadoActual != EstadoSolicitud.EN_PROCESO
                && estadoActual != EstadoSolicitud.VENCIDA) {
            throw new NegocioException("No se puede prorrogar una solicitud en estado: " + estadoActual.name());
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario actor no encontrado"));
        verificarOficialAsignadoAsiMismo(solicitud, usuario, "prorrogar");

        LocalDate nuevaFechaLimite = diasHabilesService.calcularFechaLimite(solicitud.getFechaLimite(), 10);
        solicitud.setFechaProrroga(nuevaFechaLimite);
        solicitud.setMotivoProrroga(req.getMotivoProrroga());
        solicitud.setFechaLimite(nuevaFechaLimite);
        solicitud.setEstado(EstadoSolicitud.PRORROGADA);

        SolicitudInformacion saved = solicitudRepository.save(solicitud);
        Long userId = usuario.getId();
        auditoriaService.registrarExito(userId, nombreUsuarioActor, ip,
                TipoAccion.PRORROGA_SOL, "SOLICITUD",
                saved.getCodigoExpediente(),
                "Solicitud prorrogada hasta: " + nuevaFechaLimite);

        if (StringUtils.hasText(saved.getCorreoSolicitante())) {
            emailService.enviarNotificacionProrroga(
                    saved.getCorreoSolicitante(),
                    saved.getNombreSolicitante(),
                    saved.getCodigoExpediente(),
                    nuevaFechaLimite,
                    req.getMotivoProrroga()
            );
        }

        return SolicitudAdminResponse.from(saved);
    }

    /**
     * Registra la respuesta a una solicitud y la marca como RESPONDIDA.
     */
    @Transactional
    public SolicitudAdminResponse responder(Long solicitudId, ResponderSolicitudRequest req,
                                             String nombreUsuarioActor, String ip) {
        SolicitudInformacion solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud", solicitudId));

        EstadoSolicitud estadoActual = solicitud.getEstado();
        if (estadoActual == EstadoSolicitud.RESPONDIDA
                || estadoActual == EstadoSolicitud.DENEGADA) {
            throw new NegocioException("No se puede responder una solicitud en estado: " + estadoActual.name());
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario actor no encontrado"));
        verificarOficialAsignadoAsiMismo(solicitud, usuario, "responder");

        solicitud.setRespuesta(req.getRespuesta());
        solicitud.setFechaRespuesta(LocalDateTime.now());
        solicitud.setEstado(EstadoSolicitud.RESPONDIDA);

        // Resolve adjunto documents — only PUBLICO docs may be emailed
        List<EmailService.DocAdjunto> adjuntos = new java.util.ArrayList<>();
        if (req.getDocumentoAdjuntoIds() != null && !req.getDocumentoAdjuntoIds().isEmpty()) {
            List<Documento> docs = documentoRepository.findAllById(req.getDocumentoAdjuntoIds())
                    .stream()
                    .filter(d -> d.getNivelAcceso() == NivelAcceso.PUBLICO)
                    .toList();
            if (!docs.isEmpty()) {
                solicitud.setDocumentoRespuesta(docs.get(0));
            }
            adjuntos.addAll(docs.stream()
                    .map(d -> new EmailService.DocAdjunto(d.getNombreArchivo(), d.getR2Key()))
                    .toList());
        }

        // Documentos de Información de Oficio (LAIP) — todos públicos por naturaleza
        if (req.getDocumentoOficioAdjuntoIds() != null && !req.getDocumentoOficioAdjuntoIds().isEmpty()) {
            List<DocumentoOficio> docsOficio = documentoOficioRepository.findAllById(req.getDocumentoOficioAdjuntoIds());
            adjuntos.addAll(docsOficio.stream()
                    .map(d -> new EmailService.DocAdjunto(d.getArchivoNombre(), d.getArchivoR2Key()))
                    .toList());
        }

        SolicitudInformacion saved = solicitudRepository.save(solicitud);
        Long userId = usuario.getId();
        auditoriaService.registrarExito(userId, nombreUsuarioActor, ip,
                TipoAccion.RESPOND_SOL, "SOLICITUD",
                saved.getCodigoExpediente(),
                "Solicitud respondida por: " + nombreUsuarioActor + " (oficial asignado: "
                        + saved.getOficialAsignado().getNombreCompleto() + ")");

        if (StringUtils.hasText(saved.getCorreoSolicitante())) {
            emailService.enviarNotificacionRespuesta(
                    saved.getCorreoSolicitante(),
                    saved.getNombreSolicitante(),
                    saved.getCodigoExpediente(),
                    req.getRespuesta(),
                    adjuntos
            );
        }

        return SolicitudAdminResponse.from(saved);
    }

    /**
     * Deniega una solicitud con la causal indicada.
     */
    @Transactional
    public SolicitudAdminResponse denegar(Long solicitudId, DenegarSolicitudRequest req,
                                          String nombreUsuarioActor, String ip) {
        SolicitudInformacion solicitud = solicitudRepository.findById(solicitudId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud", solicitudId));

        EstadoSolicitud estadoActual = solicitud.getEstado();
        if (estadoActual != EstadoSolicitud.PENDIENTE && estadoActual != EstadoSolicitud.EN_PROCESO
                && estadoActual != EstadoSolicitud.VENCIDA) {
            throw new NegocioException("No se puede denegar una solicitud en estado: " + estadoActual.name());
        }

        Usuario usuario = usuarioRepository.findByNombreUsuario(nombreUsuarioActor)
                .orElseThrow(() -> new NegocioException("Usuario actor no encontrado"));
        verificarOficialAsignadoAsiMismo(solicitud, usuario, "denegar");

        solicitud.setCausalDenegacion(req.getCausalDenegacion());
        solicitud.setEstado(EstadoSolicitud.DENEGADA);
        solicitud.setFechaRespuesta(LocalDateTime.now());

        SolicitudInformacion saved = solicitudRepository.save(solicitud);
        Long userId = usuario.getId();
        auditoriaService.registrarExito(userId, nombreUsuarioActor, ip,
                TipoAccion.DENY_SOL, "SOLICITUD",
                saved.getCodigoExpediente(),
                "Solicitud denegada por: " + nombreUsuarioActor);

        if (StringUtils.hasText(saved.getCorreoSolicitante())) {
            emailService.enviarNotificacionDenegacion(
                    saved.getCorreoSolicitante(),
                    saved.getNombreSolicitante(),
                    saved.getCodigoExpediente(),
                    req.getCausalDenegacion()
            );
        }

        return SolicitudAdminResponse.from(saved);
    }

    // =========================================================================
    // Internal helpers
    // =========================================================================

    /**
     * Solo el oficial asignado a la solicitud puede responder, prorrogar o denegar.
     * El rol ADMINISTRADOR queda excluido de estas acciones (solo ve y asigna).
     */
    private void verificarOficialAsignadoAsiMismo(SolicitudInformacion solicitud, Usuario actor, String accion) {
        if (actor.getRol() != RolUsuario.OFICIAL) {
            throw new NegocioException("Solo un oficial asignado puede " + accion + " una solicitud");
        }
        Usuario asignado = solicitud.getOficialAsignado();
        if (asignado == null || !asignado.getId().equals(actor.getId())) {
            throw new NegocioException("Debe estar asignado a esta solicitud para poder " + accion + "la");
        }
    }

    /**
     * Genera el siguiente código de expediente con formato SOL-YYYY-NNNN.
     * Usa bloqueo pesimista para garantizar unicidad en concurrencia.
     * Resetea el contador si el año cambió.
     */
    @Transactional
    public String generarCodigoExpediente() {
        int anioActual = LocalDate.now().getYear();

        SecuenciaCodigo seq = secuenciaRepository
                .findByTipoForUpdate("SOLICITUD")
                .orElseThrow(() -> new IllegalStateException(
                        "Secuencia 'SOLICITUD' no encontrada en secuencias_codigo"));

        // Resetear contador si el año cambió
        if (seq.getAnio() != anioActual) {
            seq.setAnio(anioActual);
            seq.setUltimoNum(0);
        }

        seq.setUltimoNum(seq.getUltimoNum() + 1);
        secuenciaRepository.save(seq);

        return String.format("%s-%d-%04d", seq.getPrefijo(), seq.getAnio(), seq.getUltimoNum());
    }
}
