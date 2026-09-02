package gt.gob.sanraymundo.sgdp.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock private RestTemplate restTemplate;
    @Mock private R2StorageService r2StorageService;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(restTemplate, r2StorageService);
        ReflectionTestUtils.setField(emailService, "apiKey", "test-key");
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@sanraymundo.gob.gt");
        ReflectionTestUtils.setField(emailService, "senderName", "Municipalidad de San Raymundo");
    }

    @Test
    void enviarConfirmacionSolicitud_llamaRestTemplate() {
        emailService.enviarConfirmacionSolicitud("juan@x.com", "Juan", "SOL-2026-0001", LocalDate.now().plusDays(10), "Descripción");

        verify(restTemplate).postForEntity(eq("https://api.brevo.com/v3/smtp/email"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void enviarNotificacionRespuesta_sinAdjuntos_noDescargaR2() {
        emailService.enviarNotificacionRespuesta("juan@x.com", "Juan", "SOL-2026-0001", "Respuesta texto", List.of());

        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
        verify(r2StorageService, never()).downloadBytes(anyString());
    }

    @Test
    void enviarNotificacionRespuesta_conAdjuntos_descargaYCodifica() {
        when(r2StorageService.downloadBytes("key1")).thenReturn("contenido".getBytes());

        emailService.enviarNotificacionRespuesta("juan@x.com", "Juan", "SOL-2026-0001", "Respuesta",
                List.of(new EmailService.DocAdjunto("doc.pdf", "key1")));

        verify(r2StorageService).downloadBytes("key1");
        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void enviarNotificacionRespuesta_fallaDescargaAdjunto_continuaSinRomper() {
        when(r2StorageService.downloadBytes("key1")).thenThrow(new RuntimeException("R2 error"));

        emailService.enviarNotificacionRespuesta("juan@x.com", "Juan", "SOL-2026-0001", "Respuesta",
                List.of(new EmailService.DocAdjunto("doc.pdf", "key1")));

        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void enviarNotificacionProrroga_llamaRestTemplate() {
        emailService.enviarNotificacionProrroga("juan@x.com", "Juan", "SOL-2026-0001", LocalDate.now().plusDays(20), "Motivo válido");

        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void alertaDia7_llamaRestTemplate() {
        emailService.alertaDia7("juan@x.com", "Juan", "SOL-2026-0001", LocalDate.now().plusDays(3), 3);

        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void enviarNotificacionDenegacion_llamaRestTemplate() {
        emailService.enviarNotificacionDenegacion("juan@x.com", "Juan", "SOL-2026-0001", "Información reservada");

        verify(restTemplate).postForEntity(anyString(), any(), eq(String.class));
    }

    @Test
    void enviar_restTemplateLanzaExcepcion_noPropaga() {
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenThrow(new RuntimeException("Brevo caído"));

        emailService.alertaDia7("juan@x.com", "Juan", "SOL-2026-0001", LocalDate.now().plusDays(1), 1);
        // no exception propagates — swallowed and logged
    }
}
