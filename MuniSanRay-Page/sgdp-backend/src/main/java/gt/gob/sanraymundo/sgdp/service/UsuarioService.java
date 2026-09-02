package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.dto.request.ActualizarUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.CrearUsuarioRequest;
import gt.gob.sanraymundo.sgdp.dto.request.ResetPasswordRequest;
import gt.gob.sanraymundo.sgdp.dto.response.UsuarioResponse;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import gt.gob.sanraymundo.sgdp.model.entity.HistorialContrasena;
import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import gt.gob.sanraymundo.sgdp.model.enums.TipoAccion;
import gt.gob.sanraymundo.sgdp.repository.HistorialContrasenaRepository;
import gt.gob.sanraymundo.sgdp.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final HistorialContrasenaRepository historialContrasenaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    // -------------------------------------------------------------------------
    // listar
    // -------------------------------------------------------------------------

    public Page<UsuarioResponse> listar(Pageable pageable, boolean incluirInactivos) {
        Page<Usuario> page = incluirInactivos
                ? usuarioRepository.findAll(pageable)
                : usuarioRepository.findByActivoTrue(pageable);
        return page.map(UsuarioResponse::from);
    }

    // -------------------------------------------------------------------------
    // obtenerPorId
    // -------------------------------------------------------------------------

    public UsuarioResponse obtenerPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado con id: " + id));
        return UsuarioResponse.from(usuario);
    }

    // -------------------------------------------------------------------------
    // crear
    // -------------------------------------------------------------------------

    @Transactional
    public UsuarioResponse crear(CrearUsuarioRequest req, String nombreUsuarioAdmin, String ip) {
        String nombreUsuario = req.getNombreUsuario().trim().toLowerCase();
        String correo = req.getCorreoElectronico() != null && !req.getCorreoElectronico().isBlank()
                ? req.getCorreoElectronico().trim().toLowerCase()
                : null;

        if (usuarioRepository.existsByNombreUsuario(nombreUsuario)) {
            throw new NegocioException("El nombre de usuario ya está registrado");
        }
        if (correo != null && usuarioRepository.existsByCorreoElectronico(correo)) {
            throw new NegocioException("El correo ya está registrado");
        }
        if (req.getDpi() != null && !req.getDpi().isBlank() && usuarioRepository.existsByDpi(req.getDpi())) {
            throw new NegocioException("El DPI ya está registrado");
        }

        String hash = passwordEncoder.encode(req.getContrasena());

        Usuario usuario = Usuario.builder()
                .nombreCompleto(req.getNombreCompleto())
                .dpi(req.getDpi())
                .nombreUsuario(nombreUsuario)
                .correoElectronico(correo)
                .contrasenaHash(hash)
                .rol(req.getRol())
                .unidadMunicipal(req.getUnidadMunicipal())
                .activo(true)
                .requiereCambioContrasena(true)
                .intentosFallidos(0)
                .build();

        Usuario saved = usuarioRepository.save(usuario);

        HistorialContrasena historial = HistorialContrasena.builder()
                .usuario(saved)
                .contrasenaHash(hash)
                .build();
        historialContrasenaRepository.save(historial);

        Long adminId = usuarioRepository.findByNombreUsuario(nombreUsuarioAdmin)
                .map(Usuario::getId)
                .orElse(null);

        auditoriaService.registrarExito(
                adminId,
                nombreUsuarioAdmin,
                ip,
                TipoAccion.CREATE_USER,
                "USUARIO",
                saved.getId().toString(),
                saved.getNombreUsuario()
        );

        return UsuarioResponse.from(saved);
    }

    // -------------------------------------------------------------------------
    // actualizar
    // -------------------------------------------------------------------------

    @Transactional
    public UsuarioResponse actualizar(Long id, ActualizarUsuarioRequest req, String nombreUsuarioAdmin, String ip) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado con id: " + id));

        usuario.setNombreCompleto(req.getNombreCompleto());
        usuario.setRol(req.getRol());
        usuario.setUnidadMunicipal(req.getUnidadMunicipal());

        String nuevoNombreUsuario = req.getNombreUsuario().trim().toLowerCase();
        if (!nuevoNombreUsuario.equals(usuario.getNombreUsuario())) {
            if (usuarioRepository.existsByNombreUsuario(nuevoNombreUsuario)) {
                throw new NegocioException("El nombre de usuario ya está en uso por otro usuario");
            }
            usuario.setNombreUsuario(nuevoNombreUsuario);
        }

        String nuevoCorreo = req.getCorreoElectronico() != null && !req.getCorreoElectronico().isBlank()
                ? req.getCorreoElectronico().trim().toLowerCase()
                : null;
        if (!java.util.Objects.equals(nuevoCorreo, usuario.getCorreoElectronico())) {
            if (nuevoCorreo != null && usuarioRepository.existsByCorreoElectronico(nuevoCorreo)) {
                throw new NegocioException("El correo electrónico ya está en uso por otro usuario");
            }
            usuario.setCorreoElectronico(nuevoCorreo);
        }

        Usuario saved = usuarioRepository.save(usuario);

        Long adminId = usuarioRepository.findByNombreUsuario(nombreUsuarioAdmin)
                .map(Usuario::getId)
                .orElse(null);

        auditoriaService.registrarExito(
                adminId,
                nombreUsuarioAdmin,
                ip,
                TipoAccion.UPDATE_USER,
                "USUARIO",
                saved.getId().toString(),
                saved.getNombreUsuario()
        );

        return UsuarioResponse.from(saved);
    }

    // -------------------------------------------------------------------------
    // toggleActivo
    // -------------------------------------------------------------------------

    @Transactional
    public UsuarioResponse toggleActivo(Long id, String nombreUsuarioAdmin, String ip) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado con id: " + id));

        boolean nuevoEstado = !usuario.getActivo();
        usuario.setActivo(nuevoEstado);

        if (!nuevoEstado) {
            usuario.setIntentosFallidos(0);
            usuario.setBloqueadoHasta(null);
        }

        Usuario saved = usuarioRepository.save(usuario);

        Long adminId = usuarioRepository.findByNombreUsuario(nombreUsuarioAdmin)
                .map(Usuario::getId)
                .orElse(null);

        String detalle = nuevoEstado ? "activado" : "desactivado";

        auditoriaService.registrar(
                adminId,
                nombreUsuarioAdmin,
                ip,
                TipoAccion.DISABLE_USER,
                "USUARIO",
                saved.getId().toString(),
                saved.getNombreUsuario(),
                "EXITO",
                java.util.Map.of("estado", detalle)
        );

        return UsuarioResponse.from(saved);
    }

    // -------------------------------------------------------------------------
    // resetearContrasena
    // -------------------------------------------------------------------------

    @Transactional
    public void resetearContrasena(Long id, ResetPasswordRequest req, String nombreUsuarioAdmin, String ip) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NegocioException("Usuario no encontrado con id: " + id));

        List<HistorialContrasena> ultimas3 =
                historialContrasenaRepository.findTop3ByUsuarioOrderByCreatedAtDesc(usuario);

        for (HistorialContrasena hist : ultimas3) {
            if (passwordEncoder.matches(req.getNuevaContrasena(), hist.getContrasenaHash())) {
                throw new NegocioException("No puede reutilizar una de sus últimas 3 contraseñas");
            }
        }

        String nuevoHash = passwordEncoder.encode(req.getNuevaContrasena());

        usuario.setContrasenaHash(nuevoHash);
        usuario.setRequiereCambioContrasena(true);
        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);

        HistorialContrasena historial = HistorialContrasena.builder()
                .usuario(usuario)
                .contrasenaHash(nuevoHash)
                .build();
        historialContrasenaRepository.save(historial);

        usuarioRepository.save(usuario);

        Long adminId = usuarioRepository.findByNombreUsuario(nombreUsuarioAdmin)
                .map(Usuario::getId)
                .orElse(null);

        auditoriaService.registrarExito(
                adminId,
                nombreUsuarioAdmin,
                ip,
                TipoAccion.RESET_PASSWORD,
                "USUARIO",
                usuario.getId().toString(),
                usuario.getNombreUsuario()
        );
    }
}
