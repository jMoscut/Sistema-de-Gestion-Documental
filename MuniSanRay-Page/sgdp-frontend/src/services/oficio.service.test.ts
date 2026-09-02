import { oficioService } from './oficio.service'
import api from './api'

const mockApi = api as jest.Mocked<typeof api>

describe('oficioService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('listarCategorias usa seccion por defecto LAIP', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await oficioService.listarCategorias()

    expect(mockApi.get).toHaveBeenCalledWith('/admin/oficio/categorias', { params: { seccion: 'LAIP' } })
  })

  it('listarCategorias respeta seccion explícita', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await oficioService.listarCategorias('COMUDE')

    expect(mockApi.get).toHaveBeenCalledWith('/admin/oficio/categorias', { params: { seccion: 'COMUDE' } })
  })

  it('crearCategoria hace POST', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1 } })

    await oficioService.crearCategoria({ seccion: 'LAIP', nombre: 'Nueva' })

    expect(mockApi.post).toHaveBeenCalledWith('/admin/oficio/categorias', { seccion: 'LAIP', nombre: 'Nueva' })
  })

  it('actualizarCategoria hace PUT al id', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { id: 1 } })

    await oficioService.actualizarCategoria(1, { seccion: 'LAIP', nombre: 'Editada' })

    expect(mockApi.put).toHaveBeenCalledWith('/admin/oficio/categorias/1', { seccion: 'LAIP', nombre: 'Editada' })
  })

  it('eliminarCategoria hace DELETE al id', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: undefined })

    await oficioService.eliminarCategoria(1)

    expect(mockApi.delete).toHaveBeenCalledWith('/admin/oficio/categorias/1')
  })

  it('buscar pasa q y seccion como params', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await oficioService.buscar('reglamento', 'LAIP')

    expect(mockApi.get).toHaveBeenCalledWith('/admin/oficio/buscar', { params: { q: 'reglamento', seccion: 'LAIP' } })
  })

  it('listarCarpetas hace GET al catId', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await oficioService.listarCarpetas(1)

    expect(mockApi.get).toHaveBeenCalledWith('/admin/oficio/categorias/1/carpetas')
  })

  it('crearCarpeta hace POST al catId', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 10 } })

    await oficioService.crearCarpeta(1, { nombre: 'Carpeta' })

    expect(mockApi.post).toHaveBeenCalledWith('/admin/oficio/categorias/1/carpetas', { nombre: 'Carpeta' })
  })

  it('actualizarCarpeta hace PUT al carpetaId', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { id: 10 } })

    await oficioService.actualizarCarpeta(10, { nombre: 'Editada' })

    expect(mockApi.put).toHaveBeenCalledWith('/admin/oficio/carpetas/10', { nombre: 'Editada' })
  })

  it('eliminarCarpeta hace DELETE al carpetaId', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: undefined })

    await oficioService.eliminarCarpeta(10)

    expect(mockApi.delete).toHaveBeenCalledWith('/admin/oficio/carpetas/10')
  })

  it('listarDocumentos hace GET al carpetaId', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await oficioService.listarDocumentos(10)

    expect(mockApi.get).toHaveBeenCalledWith('/admin/oficio/carpetas/10/documentos')
  })

  it('subirDocumento arma FormData con datos y archivo', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1 } })
    const archivo = new File(['x'], 'a.pdf', { type: 'application/pdf' })

    await oficioService.subirDocumento(10, { titulo: 'Doc' }, archivo)

    expect(mockApi.post).toHaveBeenCalledWith('/admin/oficio/carpetas/10/documentos', expect.any(FormData))
  })

  it('eliminarDocumento hace DELETE al docId', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: undefined })

    await oficioService.eliminarDocumento(5)

    expect(mockApi.delete).toHaveBeenCalledWith('/admin/oficio/documentos/5')
  })
})
