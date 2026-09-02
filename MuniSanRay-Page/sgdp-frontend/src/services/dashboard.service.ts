import api from './api'
import type { DashboardStats, MetaModulo } from '../types/dashboard.types'

export const dashboardService = {
  getStats: () =>
    api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),

  getMetas: () =>
    api.get<MetaModulo[]>('/admin/dashboard/metas').then((r) => r.data),

  actualizarMeta: (modulo: string, metaValor: number) =>
    api.patch<MetaModulo>(`/admin/dashboard/metas/${modulo}`, { metaValor }).then((r) => r.data),
}
