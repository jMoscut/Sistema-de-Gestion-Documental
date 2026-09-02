export type ResultadoAuditoria = 'EXITO' | 'FALLO' | 'DENEGADO'

export interface AuditoriaResponse {
  id: number
  timestampUtc: string
  usuarioId?: number
  usuarioDesc?: string
  ipOrigen?: string
  accion: string
  objetoTipo?: string
  objetoId?: string
  objetoDesc?: string
  resultado: ResultadoAuditoria
  detalle?: string
}

export interface AuditoriaFiltros {
  accion?: string
  usuarioId?: number
  desde?: string
  hasta?: string
  page?: number
  size?: number
}

export const ACCIONES_AUDITORIA = [
  'LOGIN_EXITOSO',
  'LOGIN_FALLIDO',
  'LOGOUT',
  'CUENTA_BLOQUEADA',
  'CREATE_DOC',
  'READ_DOC',
  'DOWNLOAD_DOC',
  'VERSION_DOC',
  'CREATE_SOL',
  'RESPOND_SOL',
  'DENY_SOL',
  'PRORROGA_SOL',
  'VENCIMIENTO_SOL',
  'CREATE_USER',
  'UPDATE_USER',
  'DISABLE_USER',
  'RESET_PASSWORD',
  'PUBLISH_OFICIO',
  'ACCESS_DENIED',
  'INTEGRITY_FAIL',
  'EXPORT_REPORT',
  'EXPORT_LOG',
] as const
