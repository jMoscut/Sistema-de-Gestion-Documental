import api from './api'
import type {
  CategoriaDocumento,
  CrearCategoriaDocumentoRequest,
  DocumentoResponse,
  DocumentosPage,
  SubirDocumentoForm,
  VersionDocumentoResponse,
} from '../types/documentos.types'

export const documentosService = {
  listarCategorias: async (): Promise<CategoriaDocumento[]> => {
    const { data } = await api.get('/documentos/categorias')
    return data
  },

  crearCategoria: async (body: CrearCategoriaDocumentoRequest): Promise<CategoriaDocumento> => {
    const { data } = await api.post('/documentos/categorias', body)
    return data
  },

  actualizarCategoria: async (id: number, body: CrearCategoriaDocumentoRequest): Promise<CategoriaDocumento> => {
    const { data } = await api.put(`/documentos/categorias/${id}`, body)
    return data
  },

  eliminarCategoria: async (id: number): Promise<void> => {
    await api.delete(`/documentos/categorias/${id}`)
  },

  buscar: async (params: {
    q?: string
    nivelAcceso?: string
    estado?: string
    page?: number
    size?: number
  }): Promise<DocumentosPage> => {
    const { data } = await api.get('/documentos', { params })
    return data
  },

  subirDocumento: async (file: File, metadata: SubirDocumentoForm): Promise<DocumentoResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    const { data } = await api.post('/documentos', formData)
    return data
  },

  descargar: async (id: number, nombreArchivo: string): Promise<void> => {
    const response = await api.get(`/documentos/${id}/descargar`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', nombreArchivo)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  archivar: async (id: number): Promise<DocumentoResponse> => {
    const { data } = await api.patch(`/documentos/${id}/archivar`)
    return data
  },

  reactivar: async (id: number): Promise<DocumentoResponse> => {
    const { data } = await api.patch(`/documentos/${id}/reactivar`)
    return data
  },

  subirNuevaVersion: async (id: number, file: File, motivoCambio?: string): Promise<DocumentoResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    if (motivoCambio) formData.append('motivoCambio', motivoCambio)
    const { data } = await api.post(`/documentos/${id}/nueva-version`, formData)
    return data
  },

  listarVersiones: async (id: number): Promise<VersionDocumentoResponse[]> => {
    const { data } = await api.get(`/documentos/${id}/versiones`)
    return data
  },
}
