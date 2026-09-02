import { documentosService } from './documentos.service'
import api from './api'

const mockApi = api as jest.Mocked<typeof api>

describe('documentosService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('listarCategorias hace GET a /documentos/categorias', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [{ id: 1, nombre: 'Presupuestaria' }] })

    const result = await documentosService.listarCategorias()

    expect(mockApi.get).toHaveBeenCalledWith('/documentos/categorias')
    expect(result).toEqual([{ id: 1, nombre: 'Presupuestaria' }])
  })

  it('crearCategoria hace POST con el body', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 2, nombre: 'Nueva' } })

    await documentosService.crearCategoria({ nombre: 'Nueva', descripcion: 'x', esLaip: true } as never)

    expect(mockApi.post).toHaveBeenCalledWith('/documentos/categorias', { nombre: 'Nueva', descripcion: 'x', esLaip: true })
  })

  it('actualizarCategoria hace PUT al endpoint con id', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { id: 2, nombre: 'Editada' } })

    await documentosService.actualizarCategoria(2, { nombre: 'Editada' } as never)

    expect(mockApi.put).toHaveBeenCalledWith('/documentos/categorias/2', { nombre: 'Editada' })
  })

  it('eliminarCategoria hace DELETE al endpoint con id', async () => {
    mockApi.delete.mockResolvedValueOnce({ data: undefined })

    await documentosService.eliminarCategoria(3)

    expect(mockApi.delete).toHaveBeenCalledWith('/documentos/categorias/3')
  })

  it('buscar pasa los params al GET', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { content: [] } })

    await documentosService.buscar({ q: 'presupuesto', page: 1, size: 10 })

    expect(mockApi.get).toHaveBeenCalledWith('/documentos', { params: { q: 'presupuesto', page: 1, size: 10 } })
  })

  it('subirDocumento arma FormData con file y metadata', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1 } })
    const file = new File(['contenido'], 'doc.pdf', { type: 'application/pdf' })

    await documentosService.subirDocumento(file, { titulo: 'Doc' } as never)

    expect(mockApi.post).toHaveBeenCalledWith('/documentos', expect.any(FormData))
  })

  it('archivar hace PATCH al endpoint de archivar', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { id: 1, estado: 'ARCHIVADO' } })

    await documentosService.archivar(1)

    expect(mockApi.patch).toHaveBeenCalledWith('/documentos/1/archivar')
  })

  it('reactivar hace PATCH al endpoint de reactivar', async () => {
    mockApi.patch.mockResolvedValueOnce({ data: { id: 1, estado: 'VIGENTE' } })

    await documentosService.reactivar(1)

    expect(mockApi.patch).toHaveBeenCalledWith('/documentos/1/reactivar')
  })

  it('subirNuevaVersion arma FormData con motivoCambio opcional', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { id: 1 } })
    const file = new File(['v2'], 'doc-v2.pdf', { type: 'application/pdf' })

    await documentosService.subirNuevaVersion(1, file, 'Corrección de datos')

    expect(mockApi.post).toHaveBeenCalledWith('/documentos/1/nueva-version', expect.any(FormData))
  })

  it('listarVersiones hace GET al endpoint de versiones', async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] })

    await documentosService.listarVersiones(1)

    expect(mockApi.get).toHaveBeenCalledWith('/documentos/1/versiones')
  })
})
