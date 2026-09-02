package gt.gob.sanraymundo.sgdp.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {
    private long solicitudesPendientes;
    private long solicitudesEnProceso;         // EN_PROCESO + PRORROGADA
    private long solicitudesRespondidas;       // RESPONDIDA
    private long solicitudesTotal;
    private long documentosTotal;
    private int oficioPublicadas;              // categorías con contenido en sección LAIP
    private int porcentajeCumplimiento;        // (oficioPublicadas / 29) * 100
    private int carpetasDesactualizadasCount;  // carpetas sin documentos en últimos 25 días
    private List<String> carpetasDesactualizadas; // "Sección > Nombre" para mostrar en dashboard
}
