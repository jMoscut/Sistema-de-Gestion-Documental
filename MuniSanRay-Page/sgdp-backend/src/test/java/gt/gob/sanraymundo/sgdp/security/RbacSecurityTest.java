package gt.gob.sanraymundo.sgdp.security;

import gt.gob.sanraymundo.sgdp.config.SecurityConfig;
import gt.gob.sanraymundo.sgdp.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import gt.gob.sanraymundo.sgdp.controller.AuthController;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RBAC tests: verifica reglas de Spring Security sin lógica de negocio.
 * Usa WebMvcTest limitado a AuthController + SecurityConfig importado.
 * URLs sin controlador real retornan 404 (no 401/403) cuando security permite.
 *
 * CorsConfigurationSource NO se mockea con @MockBean: en Spring 6,
 * HandlerMappingIntrospector implementa CorsConfigurationSource, y tener
 * dos beans de ese tipo rompe mvcHandlerMappingIntrospectorRequestTransformer.
 * Se usa @TestConfiguration con bean real para evitar la colisión.
 */
@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtUtil.class, RbacSecurityTest.TestCorsConfig.class})
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-minimum-64-characters-long-for-hs256-algorithm-ok",
    "jwt.expiration.ms=3600000"
})
class RbacSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private CustomUserDetailsService userDetailsService;
    @MockBean private AuthService authService;

    @TestConfiguration
    static class TestCorsConfig {
        @Bean
        CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowedOriginPatterns(List.of("*"));
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(List.of("*"));
            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/**", config);
            return source;
        }
    }

    // ── Endpoints públicos ────────────────────────────────────────────────────

    @Test
    void loginEndpoint_sinAutenticacion_noRetorna401ni403() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"correo\":\"test@test.com\",\"contrasena\":\"pass\"}"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
    }

    @Test
    void publicoEndpoint_sinAutenticacion_noRetorna401ni403() throws Exception {
        // Sin controlador real → 404 (security permitAll), no 401 ni 403
        mockMvc.perform(get("/api/publico/documentos"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
    }

    // ── Endpoints protegidos: sin token ──────────────────────────────────────

    @Test
    void auditoriaEndpoint_sinAutenticacion_retorna401o403() throws Exception {
        mockMvc.perform(get("/api/admin/auditoria"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isIn(401, 403));
    }

    @Test
    void usuariosEndpoint_sinAutenticacion_retorna401o403() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isIn(401, 403));
    }

    @Test
    void adminEndpoint_sinAutenticacion_retorna401o403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isIn(401, 403));
    }

    // ── RBAC: rol insuficiente ────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "OFICIAL")
    void usuariosEndpoint_rolOficial_retorna403() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "OFICIAL")
    void auditoriaEndpoint_rolOficial_retorna403() throws Exception {
        mockMvc.perform(get("/api/admin/auditoria"))
                .andExpect(status().isForbidden());
    }

    // ── RBAC: acceso correcto ────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void usuariosEndpoint_rolAdministrador_noRetorna403() throws Exception {
        // Security permite; sin controlador real → 404 (no 403)
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(403));
    }

    @Test
    @WithMockUser(roles = "OFICIAL")
    void adminDashboard_rolOficial_noRetorna403() throws Exception {
        // /api/admin/** permite ADMINISTRADOR + OFICIAL
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotEqualTo(403));
    }

    // ── CORS preflight ───────────────────────────────────────────────────────

    @Test
    void optionsPreflight_noRetorna401ni403() throws Exception {
        // Sin Origin: no es CORS real, verifica solo que Security permite OPTIONS
        // (CORS origin policy es ortogonal a autenticación/autorización)
        mockMvc.perform(options("/api/admin/dashboard"))
                .andExpect(result ->
                    assertThat(result.getResponse().getStatus()).isNotIn(401, 403));
    }
}
