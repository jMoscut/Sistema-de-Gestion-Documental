package gt.gob.sanraymundo.sgdp.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DenegarSolicitudRequestTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void causalDenegacion_menosDe10Caracteres_generaViolacion() {
        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("Inv. (9c)");

        Set<ConstraintViolation<DenegarSolicitudRequest>> violaciones = validator.validate(req);

        assertThat(violaciones).isNotEmpty();
    }

    @Test
    void causalDenegacion_exactamente10Caracteres_noGeneraViolacion() {
        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("Inv. (10c)");

        Set<ConstraintViolation<DenegarSolicitudRequest>> violaciones = validator.validate(req);

        assertThat(violaciones).isEmpty();
    }

    @Test
    void causalDenegacion_vacia_generaViolacion() {
        DenegarSolicitudRequest req = new DenegarSolicitudRequest();
        req.setCausalDenegacion("");

        Set<ConstraintViolation<DenegarSolicitudRequest>> violaciones = validator.validate(req);

        assertThat(violaciones).isNotEmpty();
    }
}
