import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { authService } from '../services/auth.service'

jest.mock('../services/auth.service')
const mockAuthService = authService as jest.Mocked<typeof authService>

function base64UrlEncode(obj: object): string {
  const json = JSON.stringify(obj)
  const base64 = Buffer.from(json).toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildJwt(payload: object): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' })
  const body = base64UrlEncode(payload)
  return `${header}.${body}.signature`
}

function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, clearRequiereCambioContrasena } = useAuth()
  if (isLoading) return <div>Cargando</div>
  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? 'autenticado' : 'no-autenticado'}</div>
      <div data-testid="user-nombre">{user?.nombre ?? 'sin-usuario'}</div>
      <div data-testid="requiere-cambio">{user?.requiereCambioContrasena ? 'si' : 'no'}</div>
      <button
        onClick={() =>
          login({
            token: buildJwt({ userId: 1, nombre: 'Juan Perez', sub: 'juan', correo: 'juan@x.com', rol: 'ADMINISTRADOR' }),
            rol: 'ADMINISTRADOR',
            nombre: 'Juan Perez',
            requiereCambioContrasena: true,
          })
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={clearRequiereCambioContrasena}>Limpiar Cambio</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('inicia sin usuario cuando no hay token en localStorage', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no-autenticado'))
  })

  it('login decodifica el JWT y actualiza el estado', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => screen.getByText('Login'))

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('autenticado'))
    expect(screen.getByTestId('user-nombre')).toHaveTextContent('Juan Perez')
    expect(screen.getByTestId('requiere-cambio')).toHaveTextContent('si')
    expect(localStorage.getItem('sgdp_token')).not.toBeNull()
  })

  it('logout llama authService.logout, limpia token y estado', async () => {
    mockAuthService.logout.mockResolvedValueOnce({} as never)

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => screen.getByText('Login'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('autenticado'))

    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no-autenticado'))
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('sgdp_token')).toBeNull()
  })

  it('logout no rompe la UI si authService.logout falla', async () => {
    mockAuthService.logout.mockRejectedValueOnce(new Error('network error'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => screen.getByText('Login'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('autenticado'))

    fireEvent.click(screen.getByText('Logout'))

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no-autenticado'))
  })

  it('clearRequiereCambioContrasena limpia el flag', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => screen.getByText('Login'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('requiere-cambio')).toHaveTextContent('si'))

    fireEvent.click(screen.getByText('Limpiar Cambio'))

    expect(screen.getByTestId('requiere-cambio')).toHaveTextContent('no')
  })

  it('restaura sesión desde localStorage si hay token válido al montar', async () => {
    localStorage.setItem(
      'sgdp_token',
      buildJwt({ userId: 2, nombre: 'Ana', sub: 'ana', correo: null, rol: 'FUNCIONARIO' }),
    )

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('autenticado'))
    expect(screen.getByTestId('user-nombre')).toHaveTextContent('Ana')
  })

  it('descarta token inválido en localStorage al montar', async () => {
    localStorage.setItem('sgdp_token', 'token-invalido-no-jwt')

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('no-autenticado'))
    expect(localStorage.getItem('sgdp_token')).toBeNull()
  })

  it('useAuth lanza error fuera de AuthProvider', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider')
    errorSpy.mockRestore()
  })
})
