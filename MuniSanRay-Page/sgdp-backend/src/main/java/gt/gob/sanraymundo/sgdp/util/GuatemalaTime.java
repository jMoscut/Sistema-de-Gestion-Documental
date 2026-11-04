package gt.gob.sanraymundo.sgdp.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Fecha/hora "de calendario" en zona Guatemala (UTC-6, sin horario de verano).
 * Usar para cómputos de día hábil, plazos LAIP, códigos correlativos por año
 * y cualquier otro valor que represente el día calendario real del país,
 * en vez de LocalDate.now()/LocalDateTime.now() sin zona (que toma la zona
 * del JVM — UTC en Railway, desfasada respecto a Guatemala entre las
 * 18:00 y 23:59 hora local).
 */
public final class GuatemalaTime {

    public static final ZoneId ZONE = ZoneId.of("America/Guatemala");

    private GuatemalaTime() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDateTime now() {
        return LocalDateTime.now(ZONE);
    }
}
