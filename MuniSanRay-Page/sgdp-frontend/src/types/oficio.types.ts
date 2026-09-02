export interface CategoriaOficioResponse {
  id: number
  seccion: string
  numero: number
  nombre: string
  totalCarpetas: number
}

export interface CarpetaOficioResponse {
  id: number
  categoriaId: number
  categoriaNombre: string
  nombre: string
  descripcion?: string
  totalDocumentos: number
  creadoPorNombre?: string
  createdAt: string
}

export interface DocumentoOficioResponse {
  id: number
  carpetaId: number
  titulo: string
  descripcion?: string
  archivoNombre: string
  tamanoBytes: number
  subidoPorNombre?: string
  createdAt: string
}

export interface CrearCategoriaRequest {
  seccion: string
  nombre: string
}

export interface CrearCarpetaRequest {
  nombre: string
  descripcion?: string
}

export interface SubirDocumentoRequest {
  titulo: string
  descripcion?: string
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
