package gt.gob.sanraymundo.sgdp.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class DiasHabilesServiceTest {

    @InjectMocks
    private DiasHabilesService service;

    @Test
    void calcularFechaLimite_solicitudLunes_retorna10DiasHabiles() {
        // Lunes 6-jul-2026; 10 días hábiles = martes 21-jul (saltando 2 fines de semana)
        LocalDate lunes = LocalDate.of(2026, 7, 6);
        LocalDate limite = service.calcularFechaLimite(lunes, 10);
        // Cuenta desde día+1: lun 7 jul → ... → lun 20 jul (día 10)
        assertThat(limite).isEqualTo(LocalDate.of(2026, 7, 20));
    }

    @Test
    void esDiaHabil_veintiNueveJunio_retornaFalse() {
        // 29 jun: asueto San Raymundo — no es día hábil
        assertThat(service.esDiaHabil(LocalDate.of(2026, 6, 29))).isFalse();
    }

    @Test
    void esDiaHabil_primeroMayo_retornaFalse() {
        assertThat(service.esDiaHabil(LocalDate.of(2026, 5, 1))).isFalse();
    }

    @Test
    void esDiaHabil_sabado_retornaFalse() {
        assertThat(service.esDiaHabil(LocalDate.of(2026, 8, 1))).isFalse();
    }

    @Test
    void esDiaHabil_lunesTornaTrue() {
        // Lunes 3-ago-2026 no es feriado
        assertThat(service.esDiaHabil(LocalDate.of(2026, 8, 3))).isTrue();
    }

    @Test
    void diasHabilesRestantes_fechaPasada_retornaCero() {
        LocalDate ayer = LocalDate.now().minusDays(1);
        assertThat(service.diasHabilesRestantes(ayer)).isEqualTo(0);
    }

    @Test
    void diasHabilesRestantes_hoy_retornaCero() {
        assertThat(service.diasHabilesRestantes(LocalDate.now())).isEqualTo(0);
    }

    @Test
    void diasHabilesRestantes_futuro_retornaPositivo() {
        LocalDate enDiezDias = LocalDate.now().plusDays(10);
        assertThat(service.diasHabilesRestantes(enDiezDias)).isGreaterThan(0);
    }

    @Test
    void calcularSemanaSanta_2026_juevesYViernesSonFeriados() {
        // Pascua 2026 = 5 abril → Jueves Santo = 2 abril, Viernes Santo = 3 abril
        assertThat(service.esDiaHabil(LocalDate.of(2026, 4, 2))).isFalse();
        assertThat(service.esDiaHabil(LocalDate.of(2026, 4, 3))).isFalse();
        // Miércoles antes no es feriado
        assertThat(service.esDiaHabil(LocalDate.of(2026, 4, 1))).isTrue();
    }

    @Test
    void calcularFechaLimite_incluyeSemanaLaboralCompleta() {
        // 5 días hábiles desde lunes = siguiente lunes
        LocalDate lunes = LocalDate.of(2026, 8, 3);
        LocalDate limite = service.calcularFechaLimite(lunes, 5);
        assertThat(limite).isEqualTo(LocalDate.of(2026, 8, 10));
    }
}
