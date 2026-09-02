import api from './api'

async function descargarBlob(url: string, tipo: string, nombreArchivo: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: tipo })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(link.href)
}

export const reportesService = {
  // Solicitudes
  exportarSolicitudesCsv: () =>
    descargarBlob('/admin/reportes/solicitudes/csv', 'text/csv;charset=utf-8;', 'solicitudes.csv'),

  exportarSolicitudesPdf: () =>
    descargarBlob('/admin/reportes/solicitudes/pdf', 'application/pdf', 'solicitudes.pdf'),

  // Documentos
  exportarDocumentosCsv: () =>
    descargarBlob('/admin/reportes/documentos/csv', 'text/csv;charset=utf-8;', 'documentos.csv'),

  exportarDocumentosPdf: () =>
    descargarBlob('/admin/reportes/documentos/pdf', 'application/pdf', 'documentos.pdf'),

  // Auditoria
  exportarAuditoriaCsv: () =>
    descargarBlob('/admin/reportes/auditoria/csv', 'text/csv;charset=utf-8;', 'auditoria.csv'),

  exportarAuditoriaPdf: () =>
    descargarBlob('/admin/reportes/auditoria/pdf', 'application/pdf', 'auditoria.pdf'),
}
