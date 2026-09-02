import { reportesService } from './reportes.service'
import api from './api'

const mockApi = api as jest.Mocked<typeof api>

describe('reportesService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  it('exportarSolicitudesCsv pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['a,b,c']) })

    await reportesService.exportarSolicitudesCsv()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/solicitudes/csv', { responseType: 'blob' })
  })

  it('exportarSolicitudesPdf pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['%PDF']) })

    await reportesService.exportarSolicitudesPdf()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/solicitudes/pdf', { responseType: 'blob' })
  })

  it('exportarDocumentosCsv pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['a,b,c']) })

    await reportesService.exportarDocumentosCsv()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/documentos/csv', { responseType: 'blob' })
  })

  it('exportarDocumentosPdf pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['%PDF']) })

    await reportesService.exportarDocumentosPdf()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/documentos/pdf', { responseType: 'blob' })
  })

  it('exportarAuditoriaCsv pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['a,b,c']) })

    await reportesService.exportarAuditoriaCsv()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/auditoria/csv', { responseType: 'blob' })
  })

  it('exportarAuditoriaPdf pide el blob correcto', async () => {
    mockApi.get.mockResolvedValueOnce({ data: new Blob(['%PDF']) })

    await reportesService.exportarAuditoriaPdf()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/reportes/auditoria/pdf', { responseType: 'blob' })
  })
})
