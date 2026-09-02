export interface CategoriaDocumento {
  id: number
  nombre: string
  descripcion?: string
  esLaip: boolean
  activa: boolean
}

export interface DocumentoResponse {
  id: number
  codigo: string
  titulo: string
  descripcion?: string
  categoria: CategoriaDocumento
  unidadOrigen: string
  fechaEmision: string // ISO date
  nivelAcceso: 'PUBLICO' | 'INTERNO'
  nombreArchivo: string
  tamanoBytes: number
  hashSha256: string
  versionActual: number
  estado: 'VIGENTE' | 'OBSOLETO' | 'BORRADOR' | 'ARCHIVADO'
  registradoPorNombre: string
  createdAt: string // ISO datetime
}

export interface VersionDocumentoResponse {
  id: number
  documentoId: number
  numeroVersion: number
  hashSha256: string
  tamanoBytes: number
  motivoCambio?: string
  creadoPorNombre?: string
  createdAt: string
}

export interface DocumentosPage {
  content: DocumentoResponse[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface CrearCategoriaDocumentoRequest {
  nombre: string
  descripcion?: string
}

export interface SubirDocumentoForm {
  titulo: string
  descripcion?: string
  categoriaId: number
  unidadOrigen: string
  fechaEmision: string
  nivelAcceso: 'PUBLICO' | 'INTERNO'
}
