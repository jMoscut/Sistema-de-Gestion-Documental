export const publicoService = {
  listarCategoriasV2: jest.fn(),
  listarCarpetasV2: jest.fn(),
  listarDocumentosV2: jest.fn(),
  urlDocumentoV2: jest.fn((id: number) => `/api/publico/oficio/v2/documentos/${id}/archivo`),
  buscarOficio: jest.fn(),
  categoriasDocumentos: jest.fn(),
  buscarDocumentos: jest.fn(),
  urlDescargarDocumentoPublico: jest.fn((id: number) => `/api/publico/documentos/${id}/descargar`),
  presentarSolicitud: jest.fn(),
  consultarSeguimiento: jest.fn(),
}
