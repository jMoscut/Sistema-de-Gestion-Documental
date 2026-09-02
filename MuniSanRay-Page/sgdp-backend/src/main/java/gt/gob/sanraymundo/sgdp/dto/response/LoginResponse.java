package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String rol;
    private String nombre;
    private boolean requiereCambioContrasena;
}
