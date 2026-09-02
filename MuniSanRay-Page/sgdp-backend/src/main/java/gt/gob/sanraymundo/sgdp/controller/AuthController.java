package gt.gob.sanraymundo.sgdp.controller;

import gt.gob.sanraymundo.sgdp.dto.request.CambiarContrasenaRequest;
import gt.gob.sanraymundo.sgdp.dto.request.LoginRequest;
import gt.gob.sanraymundo.sgdp.dto.response.LoginResponse;
import gt.gob.sanraymundo.sgdp.dto.response.MensajeResponse;
import gt.gob.sanraymundo.sgdp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Endpoint público para autenticar usuarios y obtener JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipOrigen = extraerIp(httpRequest);
        LoginResponse response = authService.login(request, ipOrigen);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/cambiar-contrasena
     * Cambiar la contraseña del usuario autenticado.
     * Requerido cuando requiereCambioContrasena = true.
     */
    @PostMapping("/cambiar-contrasena")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MensajeResponse> cambiarContrasena(
            @Valid @RequestBody CambiarContrasenaRequest request,
            Authentication auth,
            HttpServletRequest httpRequest
    ) {
        String ipOrigen = extraerIp(httpRequest);
        authService.cambiarContrasena(auth.getName(), request, ipOrigen);
        return ResponseEntity.ok(MensajeResponse.of("Contraseña actualizada exitosamente."));
    }

    /**
     * POST /api/auth/logout
     * Registra el cierre de sesión en el log de auditoría.
     * El cliente debe descartar el JWT localmente.
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MensajeResponse> logout(
            Authentication auth,
            HttpServletRequest httpRequest
    ) {
        String ipOrigen = extraerIp(httpRequest);
        authService.logout(auth.getName(), ipOrigen);
        return ResponseEntity.ok(MensajeResponse.of("Sesión cerrada exitosamente."));
    }

    /**
     * Extrae la IP real del cliente, considerando proxies y headers X-Forwarded-For.
     */
    private String extraerIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
