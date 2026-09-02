import api from './api'
import type { NotificacionResponse } from '../types/notificaciones.types'

export const notificacionesService = {
  listar: (): Promise<NotificacionResponse[]> =>
    api.get('/admin/notificaciones').then((r) => r.data),
}
