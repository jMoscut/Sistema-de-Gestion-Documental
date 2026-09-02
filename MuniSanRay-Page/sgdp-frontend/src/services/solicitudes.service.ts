import api from './api'
import type {
  SolicitudAdminResponse,
  OficialResponse,
  PageResponse,
  AsignarOficialForm,
  ProrrogarForm,
  ResponderForm,
  DenegarForm,
  DocumentoPublico,
  DocumentoOficioPublico,
} from '../types/solicitudes.types'

interface ListarParams {
  estado?: string
  q?: string
  page?: number
  size?: number
}

export const solicitudesService = {
  listar(params: ListarParams = {}): Promise<PageResponse<SolicitudAdminResponse>> {
    return api
      .get<PageResponse<SolicitudAdminResponse>>('/solicitudes', { params })
      .then((r) => r.data)
  },

  listarOficiales(): Promise<OficialResponse[]> {
    return api.get<OficialResponse[]>('/solicitudes/oficiales').then((r) => r.data)
  },

  asignar(id: number, body: AsignarOficialForm): Promise<SolicitudAdminResponse> {
    return api
      .put<SolicitudAdminResponse>(`/solicitudes/${id}/asignar`, body)
      .then((r) => r.data)
  },

  prorrogar(id: number, body: ProrrogarForm): Promise<SolicitudAdminResponse> {
    return api
      .put<SolicitudAdminResponse>(`/solicitudes/${id}/prorrogar`, body)
      .then((r) => r.data)
  },

  responder(id: number, body: ResponderForm): Promise<SolicitudAdminResponse> {
    return api
      .put<SolicitudAdminResponse>(`/solicitudes/${id}/responder`, body)
      .then((r) => r.data)
  },

  denegar(id: number, body: DenegarForm): Promise<SolicitudAdminResponse> {
    return api
      .put<SolicitudAdminResponse>(`/solicitudes/${id}/denegar`, body)
      .then((r) => r.data)
  },

  listarDocumentosPublicos(): Promise<PageResponse<DocumentoPublico>> {
    return api
      .get<PageResponse<Omit<DocumentoPublico, 'origen'>>>('/documentos', {
        params: { nivelAcceso: 'PUBLICO', estado: 'VIGENTE', size: 100 },
      })
      .then((r) => ({
        ...r.data,
        content: r.data.content.map((d) => ({ ...d, origen: 'DOCUMENTO' as const })),
      }))
  },

  listarDocumentosOficioPublicos(): Promise<DocumentoOficioPublico[]> {
    return api.get<DocumentoOficioPublico[]>('/admin/oficio/documentos').then((r) => r.data)
  },

  async listarTodosDocumentosPublicos(): Promise<DocumentoPublico[]> {
    const [documentos, oficio] = await Promise.all([
      solicitudesService.listarDocumentosPublicos(),
      solicitudesService.listarDocumentosOficioPublicos(),
    ])
    const oficioComoPublico: DocumentoPublico[] = oficio.map((d) => ({
      id: d.id,
      codigo: 'Información de Oficio',
      titulo: d.titulo,
      nombreArchivo: d.archivoNombre,
      tamanoBytes: d.tamanoBytes,
      origen: 'OFICIO',
    }))
    return [...documentos.content, ...oficioComoPublico]
  },
}
