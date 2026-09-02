package gt.gob.sanraymundo.sgdp.config;

import gt.gob.sanraymundo.sgdp.security.JwtFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF (stateless JWT API)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // Stateless session management
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Allow all CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public endpoints
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers("/api/publico/**").permitAll()
                .requestMatchers("/publico/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()

                // Admin-only endpoints (strict)
                .requestMatchers("/api/admin/auditoria/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/admin/reportes/auditoria/**").hasRole("ADMINISTRADOR")
                .requestMatchers("/api/usuarios/**").hasRole("ADMINISTRADOR")

                // Dashboard: visible to all authenticated staff, incl. Funcionario
                .requestMatchers("/api/admin/dashboard/**").hasAnyRole("ADMINISTRADOR", "OFICIAL", "FUNCIONARIO")

                // Oficio: lectura (carpetas/documentos/descarga) visible a Funcionario; escritura solo Admin+Oficial (regla genérica abajo)
                .requestMatchers(HttpMethod.GET, "/api/admin/oficio/**").hasAnyRole("ADMINISTRADOR", "OFICIAL", "FUNCIONARIO")

                // Admin + Oficial access (oficio, resto de reportes, etc.)
                .requestMatchers("/api/admin/**").hasAnyRole("ADMINISTRADOR", "OFICIAL")

                // Official-level and above
                .requestMatchers("/api/solicitudes/**").hasAnyRole("ADMINISTRADOR", "OFICIAL")

                // Authenticated users for all other endpoints
                .anyRequest().authenticated()
            )

            // Return 401 (not 403) for unauthenticated requests so frontend can redirect to login
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autenticado")))

            // Add JWT filter before username/password auth filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
