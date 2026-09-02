export interface DashboardStats {
  solicitudesPendientes: number
  solicitudesEnProceso: number
  solicitudesRespondidas: number
  solicitudesTotal: number
  documentosTotal: number
  oficioPublicadas: number
  porcentajeCumplimiento: number
  carpetasDesactualizadasCount: number
  carpetasDesactualizadas: string[]
}

export interface MetaModulo {
  modulo: string
  etiqueta: string
  tipoMetrica: string
  actual: number
  meta: number
  porcentaje: number
}
