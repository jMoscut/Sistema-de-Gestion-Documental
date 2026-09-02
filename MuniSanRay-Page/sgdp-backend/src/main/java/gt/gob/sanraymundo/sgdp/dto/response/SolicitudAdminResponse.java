package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.SolicitudInformacion;
import gt.gob.sanraymundo.sgdp.model.enums.EstadoSolicitud;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@Builder
public class SolicitudAdminResponse {

    private Long id;
    private String codigoExpediente;
    private String nombreSolicitante;
    private String dpiSolicitante;
    private String correoSolicitante;
    private String telefonoSolicitante;
    private String descripcionSolicitud;
    private LocalDate fechaRecepcion;
    private LocalDate fechaLimite;
    private String estado;
    private Long oficialAsignadoId;
    private String oficialAsignadoNombre;
    private LocalDate fechaProrroga;
    private String motivoProrroga;
    private String respuesta;
    private LocalDateTime fechaRespuesta;
    private String causalDenegacion;
    private Long documentoRespuestaId;
    private String documentoRespuestaCodigo;
    private long diasRestantes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SolicitudAdminResponse from(SolicitudInformacion s) {
        LocalDate hoy = LocalDate.now();
        long dias = ChronoUnit.DAYS.between(hoy, s.getFechaLimite());
        if (dias < 0) dias = 0;

        boolean esTerminal = s.getEstado() == EstadoSolicitud.RESPONDIDA
                || s.getEstado() == EstadoSolicitud.DENEGADA
                || s.getEstado() == EstadoSolicitud.VENCIDA;
        boolean esFechaVencida = !s.getFechaLimite().isAfter(hoy);
        String estadoEfectivo = (esFechaVencida && !esTerminal) ? "VENCIDA" : s.getEstado().name();

        Long oficialId = null;
        String oficialNombre = null;
        if (s.getOficialAsignado() != null) {
            oficialId = s.getOficialAsignado().getId();
            oficialNombre = s.getOficialAsignado().getNombreCompleto();
        }

        Long docId = null;
        String docCodigo = null;
        if (s.getDocumentoRespuesta() != null) {
            docId = s.getDocumentoRespuesta().getId();
            docCodigo = s.getDocumentoRespuesta().getCodigo();
        }

        return SolicitudAdminResponse.builder()
                .id(s.getId())
                .codigoExpediente(s.getCodigoExpediente())
                .nombreSolicitante(s.getNombreSolicitante())
                .dpiSolicitante(s.getDpiSolicitante())
                .correoSolicitante(s.getCorreoSolicitante())
                .telefonoSolicitante(s.getTelefonoSolicitante())
                .descripcionSolicitud(s.getDescripcionSolicitud())
                .fechaRecepcion(s.getFechaRecepcion())
                .fechaLimite(s.getFechaLimite())
                .estado(estadoEfectivo)
                .oficialAsignadoId(oficialId)
                .oficialAsignadoNombre(oficialNombre)
                .fechaProrroga(s.getFechaProrroga())
                .motivoProrroga(s.getMotivoProrroga())
                .respuesta(s.getRespuesta())
                .fechaRespuesta(s.getFechaRespuesta())
                .causalDenegacion(s.getCausalDenegacion())
                .documentoRespuestaId(docId)
                .documentoRespuestaCodigo(docCodigo)
                .diasRestantes(dias)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
