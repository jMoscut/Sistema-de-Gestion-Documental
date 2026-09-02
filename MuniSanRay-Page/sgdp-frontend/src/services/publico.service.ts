import api from './api'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

import type {
  PresentarSolicitudRequest,
  SolicitudPublicaResponse,
  SeguimientoResponse,
  CategoriaOficioPublico,
  CarpetaOficioPublico,
  DocumentoOficioPublico,
  OficioBusquedaResultado,
  CategoriaDocumento,
  DocumentoPublico,
  PageResponse,
} from '../types/publico.types'

export const publicoService = {
  // v2 hierarchy
  listarCategoriasV2: (seccion = 'LAIP'): Promise<CategoriaOficioPublico[]> =>
    api.get('/publico/oficio/v2/categorias', { params: { seccion } }).then((r) => r.data),

  listarCarpetasV2: (catId: number): Promise<CarpetaOficioPublico[]> =>
    api.get(`/publico/oficio/v2/categorias/${catId}/carpetas`).then((r) => r.data),

  listarDocumentosV2: (carpetaId: number): Promise<DocumentoOficioPublico[]> =>
    api.get(`/publico/oficio/v2/carpetas/${carpetaId}/documentos`).then((r) => r.data),

  urlDocumentoV2: (docId: number) => `${API_BASE}/publico/oficio/v2/documentos/${docId}/archivo`,

  buscarOficio: (q: string, seccion = 'LAIP'): Promise<OficioBusquedaResultado[]> =>
    api.get('/publico/oficio/v2/buscar', { params: { q, seccion } }).then((r) => r.data),

  // Repositorio de documentos públicos
  categoriasDocumentos: (): Promise<CategoriaDocumento[]> =>
    api.get('/publico/documentos/categorias').then((r) => r.data),

  buscarDocumentos: (params: {
    q?: string
    categoriaId?: number | null
    page?: number
    size?: number
  }): Promise<PageResponse<DocumentoPublico>> => {
    const p: Record<string, string | number> = { page: params.page ?? 0, size: params.size ?? 12 }
    if (params.q && params.q.trim()) p.q = params.q.trim()
    if (params.categoriaId) p.categoriaId = params.categoriaId
    return api.get('/publico/documentos', { params: p }).then((r) => r.data)
  },

  urlDescargarDocumentoPublico: (id: number) => `${API_BASE}/publico/documentos/${id}/descargar`,

  presentarSolicitud: (data: PresentarSolicitudRequest) =>
    api.post<SolicitudPublicaResponse>('/publico/solicitudes', data).then((r) => r.data),

  consultarSeguimiento: (codigo: string) =>
    api
      .get<SeguimientoResponse>(`/publico/solicitudes/seguimiento/${codigo}`)
      .then((r) => r.data),
}
