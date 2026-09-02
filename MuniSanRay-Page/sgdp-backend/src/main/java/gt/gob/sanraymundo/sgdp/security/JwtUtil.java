package gt.gob.sanraymundo.sgdp.security;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration.ms}")
    private long expirationMs;

    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .subject(usuario.getNombreUsuario())
                .claim("userId", usuario.getId())
                .claim("rol", usuario.getRol().name())
                .claim("nombre", usuario.getNombreCompleto())
                .claim("correo", usuario.getCorreoElectronico())
                .claim("requiereCambioContrasena", Boolean.TRUE.equals(usuario.getRequiereCambioContrasena()))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getKey())
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
