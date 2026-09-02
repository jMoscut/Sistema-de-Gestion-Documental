export type EstadoSolicitud =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'PRORROGADA'
  | 'RESPONDIDA'
  | 'DENEGADA'
  | 'VENCIDA'

export interface SolicitudAdminResponse {
  id: number
  codigoExpediente: string
  nombreSolicitante: string
  dpiSolicitante?: string
  correoSolicitante?: string
  telefonoSolicitante?: string
  descripcionSolicitud: string
  fechaRecepcion: string
  fechaLimite: string
  estado: EstadoSolicitud
  oficialAsignadoId?: number
  oficialAsignadoNombre?: string
  fechaProrroga?: string
  motivoProrroga?: string
  respuesta?: string
  fechaRespuesta?: string
  causalDenegacion?: string
  documentoRespuestaId?: number
  documentoRespuestaCodigo?: string
  diasRestantes: number
  createdAt: string
  updatedAt: string
}

export interface OficialResponse {
  id: number
  nombreCompleto: string
  correoElectronico: string
  unidadMunicipal?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface AsignarOficialForm {
  oficialId: number
}

export interface ProrrogarForm {
  motivoProrroga: string
}

export interface ResponderForm {
  respuesta: string
  documentoAdjuntoIds?: number[]
  documentoOficioAdjuntoIds?: number[]
}

type OrigenDocumento = 'DOCUMENTO' | 'OFICIO'

export interface DocumentoPublico {
  id: number
  codigo: string
  titulo: string
  nombreArchivo: string
  tamanoBytes: number
  origen: OrigenDocumento
}

export interface DocumentoOficioPublico {
  id: number
  carpetaId: number
  titulo: string
  descripcion?: string
  archivoNombre: string
  tamanoBytes: number
  subidoPorNombre?: string
  createdAt: string
}

export interface DenegarForm {
  causalDenegacion: string
}
