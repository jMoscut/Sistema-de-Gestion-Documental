export interface PresentarSolicitudRequest {
  nombreSolicitante: string
  dpiSolicitante?: string
  correoSolicitante?: string
  telefonoSolicitante?: string
  descripcionSolicitud: string
}

export interface SolicitudPublicaResponse {
  codigoExpediente: string
  fechaRecepcion: string
  fechaLimite: string
  estado: string
  mensaje: string
}

export interface CategoriaDocumento {
  id: number
  nombre: string
  descripcion?: string
  esLaip: boolean
  activa: boolean
}

export interface DocumentoPublico {
  id: number
  codigo: string
  titulo: string
  descripcion?: string
  categoria: CategoriaDocumento
  unidadOrigen: string
  fechaEmision: string
  nombreArchivo: string
  tamanoBytes: number
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface OficioBusquedaResultado {
  tipo: 'CARPETA' | 'DOCUMENTO'
  categoriaId: number
  categoriaNumero: number
  categoriaNombre: string
  carpetaId: number
  carpetaNombre: string
  documentoId?: number
  documentoTitulo?: string
  documentoArchivoNombre?: string
}

export interface CategoriaOficioPublico {
  id: number
  seccion: string
  numero: number
  nombre: string
  totalCarpetas: number
}

export interface CarpetaOficioPublico {
  id: number
  categoriaId: number
  categoriaNombre: string
  nombre: string
  descripcion?: string
  totalDocumentos: number
  createdAt: string
}

export interface DocumentoOficioPublico {
  id: number
  carpetaId: number
  titulo: string
  descripcion?: string
  archivoNombre: string
  tamanoBytes: number
  createdAt: string
}

export interface SeguimientoResponse {
  codigoExpediente: string
  nombreSolicitante: string
  fechaRecepcion: string
  fechaLimite: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'PRORROGADA' | 'RESPONDIDA' | 'DENEGADA' | 'VENCIDA'
  fechaProrroga?: string
  fechaRespuesta?: string
}
