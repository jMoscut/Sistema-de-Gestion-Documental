import { authService } from './auth.service'
import api from './api'

const mockApi = api as jest.Mocked<typeof api>

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('login hace POST a /auth/login con las credenciales', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { token: 'jwt-token', rol: 'ADMINISTRADOR' } })

    const result = await authService.login({ nombreUsuario: 'admin', contrasena: 'pass123' })

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', { nombreUsuario: 'admin', contrasena: 'pass123' })
    expect(result).toEqual({ token: 'jwt-token', rol: 'ADMINISTRADOR' })
  })

  it('logout hace POST a /auth/logout', () => {
    mockApi.post.mockResolvedValueOnce({ data: undefined })

    authService.logout()

    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('cambiarContrasena hace POST con las contraseñas', async () => {
    mockApi.post.mockResolvedValueOnce({ data: undefined })

    await authService.cambiarContrasena({ contrasenaActual: 'vieja', contrasenaNueva: 'Nueva1234!' })

    expect(mockApi.post).toHaveBeenCalledWith('/auth/cambiar-contrasena', {
      contrasenaActual: 'vieja',
      contrasenaNueva: 'Nueva1234!',
    })
  })
})
