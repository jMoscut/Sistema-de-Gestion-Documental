import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ChangePasswordPage from './ChangePasswordPage'
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

describe('ChangePasswordPage', () => {
  const mockClear = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ clearRequiereCambioContrasena: mockClear })
  })

  function fillForm(actual: string, nueva: string, confirmar: string) {
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: nueva } })
    fireEvent.change(screen.getByLabelText('Confirmar nueva contraseña'), { target: { value: confirmar } })
  }

  it('valida contraseña nueva débil', async () => {
    render(<ChangePasswordPage />, { wrapper: MemoryRouter })

    fillForm('actual123', 'debil', 'debil')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }))

    expect(await screen.findByText(/Mínimo 8 caracteres/)).toBeInTheDocument()
  })

  it('valida que las contraseñas coincidan', async () => {
    render(<ChangePasswordPage />, { wrapper: MemoryRouter })

    fillForm('actual123', 'Nueva1234!', 'Otra1234!')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })

  it('éxito: llama servicio, limpia flag y navega a dashboard', async () => {
    mockAuthService.cambiarContrasena.mockResolvedValueOnce(undefined)

    render(<ChangePasswordPage />, { wrapper: MemoryRouter })

    fillForm('actual123', 'Nueva1234!', 'Nueva1234!')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }))

    await waitFor(() => expect(mockClear).toHaveBeenCalled())
    expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true })
  })

  it('muestra error del servidor si la petición falla', async () => {
    mockAuthService.cambiarContrasena.mockRejectedValueOnce({
      response: { data: { error: 'La contraseña actual es incorrecta' } },
    })

    render(<ChangePasswordPage />, { wrapper: MemoryRouter })

    fillForm('actualMal', 'Nueva1234!', 'Nueva1234!')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }))

    expect(await screen.findByText('La contraseña actual es incorrecta')).toBeInTheDocument()
  })

  it('muestra mensaje genérico si el error no trae detalle', async () => {
    mockAuthService.cambiarContrasena.mockRejectedValueOnce({})

    render(<ChangePasswordPage />, { wrapper: MemoryRouter })

    fillForm('actualMal', 'Nueva1234!', 'Nueva1234!')
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar Contraseña' }))

    expect(await screen.findByText('Error al cambiar la contraseña. Intente nuevamente.')).toBeInTheDocument()
  })
})
