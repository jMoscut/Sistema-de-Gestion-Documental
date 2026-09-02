import { usuariosService } from './usuarios.service'
import api from './api'

const mockApi = api as jest.Mocked<typeof api>

describe('usuariosService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('listar usa valores por defecto page/size/incluirInactivos', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { content: [] } })

    await usuariosService.listar()

    expect(mockApi.get).toHaveBeenCalledWith('/usuarios', {
      params: { page: 0, size: 20, incluirInactivos: false },
    })
  })

  it('listar respeta params explícitos', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { content: [] } })

    await usuariosService.listar({ page: 2, size: 10, incluirInactivos: true })

    expect(mockApi.get).toHaveBeenCalledWith('/usuarios', {
      params: { page: 2, size: 10, incluirInactivos: true },
    })
  })

  it('crear envía POST con el body y retorna data', async () => {
    const body = { nombreCompleto: 'Juan', nombreUsuario: 'juan', contrasena: 'pass1234', rol: 'FUNCIONARIO' as const }
    mockApi.post.mockResolvedValueOnce({ data: { id: 1, ...body } })

    const result = await usuariosService.crear(body)

    expect(mockApi.post).toHaveBeenCalledWith('/usuarios', body)
    expect(result).toEqual({ id: 1, ...body })
  })

  it('actualizar envía PUT al endpoint con id', async () => {
    const body = { nombreCompleto: 'Juan U', nombreUsuario: 'juan', rol: 'OFICIAL' as const }
    mockApi.put.mockResolvedValueOnce({ data: { id: 5, ...body } })

    await usuariosService.actualizar(5, body)

    expect(mockApi.put).toHaveBeenCalledWith('/usuarios/5', body)
  })

  it('toggleActivo envía PUT sin body', async () => {
    mockApi.put.mockResolvedValueOnce({ data: { id: 5, activo: false } })

    await usuariosService.toggleActivo(5)

    expect(mockApi.put).toHaveBeenCalledWith('/usuarios/5/toggle-activo')
  })

  it('resetPassword envía PUT con nueva contraseña', async () => {
    mockApi.put.mockResolvedValueOnce({ data: undefined })

    await usuariosService.resetPassword(5, { nuevaContrasena: 'Nueva1234!' })

    expect(mockApi.put).toHaveBeenCalledWith('/usuarios/5/reset-password', { nuevaContrasena: 'Nueva1234!' })
  })
})
