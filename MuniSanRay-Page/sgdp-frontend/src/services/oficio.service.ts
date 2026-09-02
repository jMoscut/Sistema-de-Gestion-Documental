import api from './api'
import type {
  CategoriaOficioResponse,
  CarpetaOficioResponse,
  DocumentoOficioResponse,
  CrearCategoriaRequest,
  CrearCarpetaRequest,
  SubirDocumentoRequest,
  OficioBusquedaResultado,
} from '../types/oficio.types'

export const oficioService = {
  // Categories
  listarCategorias: (seccion = 'LAIP'): Promise<CategoriaOficioResponse[]> =>
    api.get('/admin/oficio/categorias', { params: { seccion } }).then((r) => r.data),

  crearCategoria: (data: CrearCategoriaRequest): Promise<CategoriaOficioResponse> =>
    api.post('/admin/oficio/categorias', data).then((r) => r.data),

  actualizarCategoria: (catId: number, data: CrearCategoriaRequest): Promise<CategoriaOficioResponse> =>
    api.put(`/admin/oficio/categorias/${catId}`, data).then((r) => r.data),

  eliminarCategoria: (catId: number): Promise<void> =>
    api.delete(`/admin/oficio/categorias/${catId}`).then(() => undefined),

  buscar: (q: string, seccion: string): Promise<OficioBusquedaResultado[]> =>
    api.get('/admin/oficio/buscar', { params: { q, seccion } }).then((r) => r.data),

  // Folders
  listarCarpetas: (catId: number): Promise<CarpetaOficioResponse[]> =>
    api.get(`/admin/oficio/categorias/${catId}/carpetas`).then((r) => r.data),

  crearCarpeta: (catId: number, data: CrearCarpetaRequest): Promise<CarpetaOficioResponse> =>
    api.post(`/admin/oficio/categorias/${catId}/carpetas`, data).then((r) => r.data),

  actualizarCarpeta: (carpetaId: number, data: CrearCarpetaRequest): Promise<CarpetaOficioResponse> =>
    api.put(`/admin/oficio/carpetas/${carpetaId}`, data).then((r) => r.data),

  eliminarCarpeta: (carpetaId: number): Promise<void> =>
    api.delete(`/admin/oficio/carpetas/${carpetaId}`).then(() => undefined),

  // Documents
  listarDocumentos: (carpetaId: number): Promise<DocumentoOficioResponse[]> =>
    api.get(`/admin/oficio/carpetas/${carpetaId}/documentos`).then((r) => r.data),

  subirDocumento: (carpetaId: number, data: SubirDocumentoRequest, archivo: File): Promise<DocumentoOficioResponse> => {
    const formData = new FormData()
    formData.append('datos', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    formData.append('archivo', archivo)
    return api.post(`/admin/oficio/carpetas/${carpetaId}/documentos`, formData).then((r) => r.data)
  },

  eliminarDocumento: (docId: number): Promise<void> =>
    api.delete(`/admin/oficio/documentos/${docId}`).then(() => undefined),

  descargarDocumento: (docId: number, nombre: string) => {
    api.get(`/admin/oficio/documentos/${docId}/archivo`, { responseType: 'blob' }).then((r) => {
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = nombre
      a.click()
      URL.revokeObjectURL(url)
    })
  },
}
