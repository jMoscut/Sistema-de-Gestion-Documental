import api from './api'
import type { AuditoriaResponse, AuditoriaFiltros } from '../types/auditoria.types'
import type { PageResponse } from '../types/usuarios.types'

export const auditoriaService = {
  listar(params: AuditoriaFiltros = {}): Promise<PageResponse<AuditoriaResponse>> {
    const query: Record<string, string | number> = {
      page: params.page ?? 0,
      size: params.size ?? 50,
    }
    if (params.accion) query.accion = params.accion
    if (params.usuarioId != null) query.usuarioId = params.usuarioId
    if (params.desde) query.desde = params.desde
    if (params.hasta) query.hasta = params.hasta

    return api.get('/admin/auditoria', { params: query }).then((r) => r.data)
  },
}
