export type TipoNotificacion = 'SOLICITUD_POR_VENCER' | 'SOLICITUD_VENCIDA' | 'OFICIO_DESACTUALIZADO'

export interface NotificacionResponse {
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  referenciaId?: number
  codigoExpediente?: string
  diasRestantes?: number
}
