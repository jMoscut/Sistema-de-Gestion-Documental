import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from './LoginPage'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('../../services/auth.service')

const mockUseAuth = useAuth as jest.Mock
const mockAuthService = authService as jest.Mocked<typeof authService>
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

describe('LoginPage', () => {
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ login: mockLogin })
  })

  it('muestra errores de validación si los campos están vacíos', async () => {
    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    expect(await screen.findByText('El nombre de usuario es requerido')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es requerida')).toBeInTheDocument()
  })

  it('login exitoso sin requerir cambio navega a dashboard', async () => {
    mockAuthService.login.mockResolvedValueOnce({
      token: 'jwt', rol: 'ADMINISTRADOR', nombre: 'Ana', requiereCambioContrasena: false,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    await waitFor(() => expect(mockLogin).toHaveBeenCalled())
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true })
  })

  it('login exitoso requiriendo cambio navega a cambiar-contrasena', async () => {
    mockAuthService.login.mockResolvedValueOnce({
      token: 'jwt', rol: 'FUNCIONARIO', nombre: 'Ana', requiereCambioContrasena: true,
    })

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/cambiar-contrasena', { replace: true }))
  })

  it('muestra mensaje de cuenta bloqueada en error 403', async () => {
    mockAuthService.login.mockRejectedValueOnce({ response: { status: 403, data: { error: 'Cuenta bloqueada' } } })

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    expect(await screen.findByText('Cuenta bloqueada')).toBeInTheDocument()
  })

  it('muestra mensaje de credenciales incorrectas en error 401', async () => {
    mockAuthService.login.mockRejectedValueOnce({ response: { status: 401 } })

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    expect(await screen.findByText('Credenciales incorrectas. Verifique su usuario y contraseña.')).toBeInTheDocument()
  })

  it('muestra mensaje de red cuando no hay response', async () => {
    mockAuthService.login.mockRejectedValueOnce({})

    render(<LoginPage />, { wrapper: MemoryRouter })

    fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'ana' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))

    expect(await screen.findByText('No se pudo conectar con el servidor. Verifique que el backend esté activo.')).toBeInTheDocument()
  })

  it('togglea visibilidad de contraseña', () => {
    render(<LoginPage />, { wrapper: MemoryRouter })

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleButtons = screen.getAllByRole('button').filter((b) => !b.textContent?.includes('Iniciar'))
    fireEvent.click(toggleButtons[0])

    expect(passwordInput.type).toBe('text')
  })
})
