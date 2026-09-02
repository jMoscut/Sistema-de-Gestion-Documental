package gt.gob.sanraymundo.sgdp.dto.response;

import gt.gob.sanraymundo.sgdp.model.entity.Usuario;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UsuarioResponse {

    private Long id;
    private String nombreCompleto;
    private String dpi;
    private String nombreUsuario;
    private String correoElectronico;
    private String rol;
    private String unidadMunicipal;
    private Boolean activo;
    private Boolean requiereCambioContrasena;
    private Integer intentosFallidos;
    private LocalDateTime ultimoAcceso;
    private LocalDateTime createdAt;

    public static UsuarioResponse from(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .nombreCompleto(u.getNombreCompleto())
                .dpi(u.getDpi())
                .nombreUsuario(u.getNombreUsuario())
                .correoElectronico(u.getCorreoElectronico())
                .rol(u.getRol().name())
                .unidadMunicipal(u.getUnidadMunicipal())
                .activo(u.getActivo())
                .requiereCambioContrasena(u.getRequiereCambioContrasena())
                .intentosFallidos(u.getIntentosFallidos())
                .ultimoAcceso(u.getUltimoAcceso())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
