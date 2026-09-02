package gt.gob.sanraymundo.sgdp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Slf4j
public class EmailService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    /** Metadata for a document to attach to an outgoing email. */
    public record DocAdjunto(String nombre, String r2Key) {}

    private final RestTemplate restTemplate;
    private final R2StorageService r2StorageService;

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender-email:noreply@sanraymundo.gob.gt}")
    private String senderEmail;

    @Value("${brevo.sender-name:Municipalidad de San Raymundo}")
    private String senderName;

    private static final String FIRMA = "\n\nMunicipalidad de San Raymundo\n" +
            "Sistema de Gestión Documental Pública\n" +
            "Decreto 57-2008 (Ley de Acceso a la Información Pública)";

    private static final String URL_SEGUIMIENTO =
            "Para consultar el estado de su solicitud ingrese a:\nhttps://munisanray-page.pages.dev/seguimiento\n";

    public EmailService(RestTemplate restTemplate, R2StorageService r2StorageService) {
        this.restTemplate = restTemplate;
        this.r2StorageService = r2StorageService;
    }

    @Async
    public void enviarConfirmacionSolicitud(String destino, String nombre, String codigoExpediente,
                                            LocalDate fechaLimite, String descripcion) {
        String texto =
            "Estimado/a " + nombre + ",\n\n" +
            "Su solicitud de información pública ha sido recibida correctamente.\n\n" +
            "DATOS DE SU SOLICITUD:\n" +
            "Código de Expediente: " + codigoExpediente + "\n" +
            "Descripción: " + descripcion + "\n" +
            "Fecha de recepción: " + LocalDate.now() + "\n" +
            "Fecha límite de respuesta: " + fechaLimite + " (10 días hábiles)\n\n" +
            URL_SEGUIMIENTO + FIRMA;
        enviar(destino, "Solicitud recibida - Expediente " + codigoExpediente, texto,
               "confirmación", codigoExpediente, List.of());
    }

    @Async
    public void enviarNotificacionRespuesta(String destino, String nombre,
                                            String codigoExpediente, String respuesta,
                                            List<DocAdjunto> adjuntos) {
        String texto =
            "Estimado/a " + nombre + ",\n\n" +
            "Su solicitud de información pública ha sido respondida.\n\n" +
            "Código de Expediente: " + codigoExpediente + "\n\n" +
            "RESPUESTA:\n" + respuesta + "\n\n" +
            URL_SEGUIMIENTO + FIRMA;
        enviar(destino, "Solicitud respondida - Expediente " + codigoExpediente, texto,
               "respuesta", codigoExpediente, adjuntos);
    }

    @Async
    public void enviarNotificacionProrroga(String destino, String nombre,
                                           String codigoExpediente, LocalDate nuevaFechaLimite,
                                           String motivo) {
        String texto =
            "Estimado/a " + nombre + ",\n\n" +
            "Le informamos que el plazo para responder su solicitud ha sido prorrogado.\n\n" +
            "Código de Expediente: " + codigoExpediente + "\n" +
            "Nueva fecha límite de respuesta: " + nuevaFechaLimite + "\n" +
            "Motivo de la prórroga: " + motivo + "\n\n" +
            "La prórroga es de 10 días hábiles adicionales, conforme al Art. 42 LAIP.\n\n" +
            URL_SEGUIMIENTO + FIRMA;
        enviar(destino, "Prórroga de plazo - Expediente " + codigoExpediente, texto,
               "prórroga", codigoExpediente, List.of());
    }

    @Async
    public void alertaDia7(String destino, String nombre, String codigoExpediente,
                           LocalDate fechaLimite, int diasRestantes) {
        String texto =
            "Estimado/a " + nombre + ",\n\n" +
            "Le informamos que su solicitud de información pública está próxima a vencer.\n\n" +
            "Código de Expediente: " + codigoExpediente + "\n" +
            "Días hábiles restantes: " + diasRestantes + "\n" +
            "Fecha límite: " + fechaLimite + "\n\n" +
            "Conforme al Art. 42 del Decreto 57-2008 (LAIP), la institución tiene hasta " +
            "esa fecha para emitir respuesta.\n\n" +
            URL_SEGUIMIENTO + FIRMA;
        enviar(destino, "Alerta de vencimiento - Expediente " + codigoExpediente, texto,
               "alerta día 7", codigoExpediente, List.of());
    }

    @Async
    public void enviarNotificacionDenegacion(String destino, String nombre,
                                             String codigoExpediente, String causal) {
        String texto =
            "Estimado/a " + nombre + ",\n\n" +
            "Le informamos que su solicitud de información pública ha sido denegada.\n\n" +
            "Código de Expediente: " + codigoExpediente + "\n" +
            "Causal de denegación: " + causal + "\n\n" +
            "Si considera que esta decisión no es correcta, puede presentar un recurso " +
            "de revisión ante la Procuraduría de los Derechos Humanos (PDH), " +
            "conforme al Art. 61 LAIP.\n\n" +
            URL_SEGUIMIENTO + FIRMA;
        enviar(destino, "Solicitud denegada - Expediente " + codigoExpediente, texto,
               "denegación", codigoExpediente, List.of());
    }

    private void enviar(String destino, String asunto, String texto,
                        String tipo, String expediente,
                        List<DocAdjunto> adjuntos) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("sender", Map.of("name", senderName, "email", senderEmail));
            body.put("to", List.of(Map.of("email", destino)));
            body.put("subject", asunto);
            body.put("textContent", texto);

            if (!adjuntos.isEmpty()) {
                List<Map<String, String>> attachments = new ArrayList<>();
                for (DocAdjunto adj : adjuntos) {
                    try {
                        byte[] bytes = r2StorageService.downloadBytes(adj.r2Key());
                        String b64 = Base64.getEncoder().encodeToString(bytes);
                        attachments.add(Map.of("name", adj.nombre(), "content", b64));
                    } catch (Exception e) {
                        log.warn("No se pudo adjuntar documento '{}' al correo de expediente {}: {}",
                                adj.nombre(), expediente, e.getMessage());
                    }
                }
                if (!attachments.isEmpty()) {
                    body.put("attachment", attachments);
                }
            }

            restTemplate.postForEntity(BREVO_URL, new HttpEntity<>(body, headers), String.class);
            log.info("Correo {} enviado a {} expediente {} ({} adjuntos)",
                    tipo, destino, expediente, adjuntos.size());
        } catch (Exception e) {
            log.warn("No se pudo enviar correo de {} a {}: {}", tipo, destino, e.getMessage());
        }
    }
}
