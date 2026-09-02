package gt.gob.sanraymundo.sgdp.service;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Service
public class DiasHabilesService {

    /**
     * Calcula la fecha límite añadiendo {@code diasHabiles} días hábiles a {@code inicio},
     * saltando fines de semana y días festivos de Guatemala (incluyendo el asueto de San Raymundo).
     */
    public LocalDate calcularFechaLimite(LocalDate inicio, int diasHabiles) {
        LocalDate fecha = inicio;
        int contados = 0;
        while (contados < diasHabiles) {
            fecha = fecha.plusDays(1);
            if (esDiaHabil(fecha)) {
                contados++;
            }
        }
        return fecha;
    }

    public boolean esDiaHabil(LocalDate fecha) {
        DayOfWeek dow = fecha.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return false;
        return !esFeriado(fecha);
    }

    private boolean esFeriado(LocalDate fecha) {
        int mes = fecha.getMonthValue();
        int dia = fecha.getDayOfMonth();
        int anio = fecha.getYear();

        // Feriados fijos
        if (mes == 1  && dia == 1)  return true; // Año Nuevo
        if (mes == 5  && dia == 1)  return true; // Día del Trabajo
        if (mes == 6  && dia == 29) return true; // San Pedro y San Pablo (asueto San Raymundo)
        if (mes == 6  && dia == 30) return true; // Día del Ejército
        if (mes == 9  && dia == 15) return true; // Independencia
        if (mes == 10 && dia == 20) return true; // Revolución
        if (mes == 11 && dia == 1)  return true; // Todos los Santos
        if (mes == 12 && dia == 24) return true; // Nochebuena
        if (mes == 12 && dia == 25) return true; // Navidad
        if (mes == 12 && dia == 31) return true; // Fin de año

        // Semana Santa — Jueves y Viernes Santo (variable, calculado con algoritmo de Butcher/Meeus)
        LocalDate pascua = calcularPascua(anio);
        LocalDate juevesSanto = pascua.minusDays(3);
        LocalDate viernesSanto = pascua.minusDays(2);
        if (fecha.equals(juevesSanto) || fecha.equals(viernesSanto)) return true;

        return false;
    }

    public int diasHabilesRestantes(LocalDate fechaLimite) {
        LocalDate hoy = LocalDate.now();
        if (!fechaLimite.isAfter(hoy)) return 0;
        int count = 0;
        LocalDate cursor = hoy;
        while (!cursor.isAfter(fechaLimite)) {
            if (esDiaHabil(cursor)) count++;
            cursor = cursor.plusDays(1);
        }
        return count;
    }

    /**
     * Algoritmo anónimo gregoriano para calcular la fecha de Pascua (Easter Sunday).
     */
    private LocalDate calcularPascua(int year) {
        int a = year % 19;
        int b = year / 100;
        int c = year % 100;
        int d = b / 4;
        int e = b % 4;
        int f = (b + 8) / 25;
        int g = (b - f + 1) / 3;
        int h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4;
        int k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31;
        int day   = ((h + l - 7 * m + 114) % 31) + 1;
        return LocalDate.of(year, month, day);
    }
}
