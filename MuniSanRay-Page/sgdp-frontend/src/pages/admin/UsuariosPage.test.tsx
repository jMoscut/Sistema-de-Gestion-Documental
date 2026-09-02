import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UsuariosPage from './UsuariosPage'
import { usuariosService } from '../../services/usuarios.service'
import { useAuth } from '../../hooks/useAuth'
import type { UsuarioResponse, PageResponse } from '../../types/usuarios.types'

jest.mock('../../services/usuarios.service')
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

const mockUsuariosService = usuariosService as jest.Mocked<typeof usuariosService>
const mockUseAuth = useAuth as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function crearUsuario(overrides: Partial<UsuarioResponse> = {}): UsuarioResponse {
  return {
    id: 1,
    nombreCompleto: 'Juan Perez',
    nombreUsuario: 'juan',
    correoElectronico: 'juan@sanraymundo.gob.gt',
    rol: 'FUNCIONARIO',
    unidadMunicipal: 'DAFIM',
    activo: true,
    requiereCambioContrasena: false,
    intentosFallidos: 0,
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  }
}

function crearPagina(items: UsuarioResponse[], overrides: Partial<PageResponse<UsuarioResponse>> = {}): PageResponse<UsuarioResponse> {
  return { content: items, totalElements: items.length, totalPages: 1, number: 0, size: 20, first: true, last: true, ...overrides }
}

describe('UsuariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: { nombreUsuario: 'admin1' }, logout: jest.fn() })
  })

  it('muestra la lista de usuarios', async () => {
    mockUsuariosService.listar.mockResolvedValueOnce(crearPagina([crearUsuario()]))

    render(<UsuariosPage />, { wrapper })

    expect(await screen.findByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('muestra mensaje sin usuarios', async () => {
    mockUsuariosService.listar.mockResolvedValueOnce(crearPagina([]))

    render(<UsuariosPage />, { wrapper })

    expect(await screen.findByText('No se encontraron usuarios')).toBeInTheDocument()
  })

  it('muestra error cuando falla la carga', async () => {
    mockUsuariosService.listar.mockRejectedValueOnce(new Error('network error'))

    render(<UsuariosPage />, { wrapper })

    expect(await screen.findByText('Error al cargar los usuarios. Intente nuevamente.')).toBeInTheDocument()
  })

  it('checkbox de incluir inactivos dispara nueva consulta', async () => {
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByLabelText('Mostrar inactivos'))

    await waitFor(() =>
      expect(mockUsuariosService.listar).toHaveBeenLastCalledWith({ page: 0, size: 20, incluirInactivos: true }),
    )
  })

  it('togglea el estado de un usuario tras confirmar', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))
    mockUsuariosService.toggleActivo.mockResolvedValueOnce(crearUsuario({ activo: false }))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByTitle('Desactivar usuario'))

    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => expect(mockUsuariosService.toggleActivo).toHaveBeenCalledWith(1))
    confirmSpy.mockRestore()
  })

  it('no togglea si se cancela la confirmación', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByTitle('Desactivar usuario'))

    expect(mockUsuariosService.toggleActivo).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('pagina hacia adelante', async () => {
    mockUsuariosService.listar.mockResolvedValue(
      crearPagina([crearUsuario()], { totalPages: 2, totalElements: 25 }),
    )

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByText('Siguiente'))

    await waitFor(() =>
      expect(mockUsuariosService.listar).toHaveBeenLastCalledWith({ page: 1, size: 20, incluirInactivos: false }),
    )
  })

  it('abre modal de crear usuario y envía el formulario', async () => {
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))
    mockUsuariosService.crear.mockResolvedValueOnce(crearUsuario({ id: 2, nombreUsuario: 'nuevo' }))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByText('Nuevo usuario'))
    expect(screen.getByText('Nuevo usuario', { selector: 'h2' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre completo *'), { target: { value: 'Nuevo Usuario' } })
    fireEvent.change(screen.getByLabelText('Nombre de usuario *'), { target: { value: 'nuevo.user' } })
    fireEvent.change(screen.getByLabelText('Contraseña *'), { target: { value: 'password123' } })

    fireEvent.click(screen.getByText('Crear usuario'))

    await waitFor(() => expect(mockUsuariosService.crear).toHaveBeenCalled())
  })

  it('cierra el modal de crear al cancelar', async () => {
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByText('Nuevo usuario'))
    fireEvent.click(screen.getByText('Cancelar'))

    expect(screen.queryByText('Nuevo usuario', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('abre modal de editar con datos precargados', async () => {
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByTitle('Editar'))

    expect(screen.getByText('Editar usuario')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Juan Perez')).toBeInTheDocument()
  })

  it('abre modal de restablecer contraseña y envía', async () => {
    mockUsuariosService.listar.mockResolvedValue(crearPagina([crearUsuario()]))
    mockUsuariosService.resetPassword.mockResolvedValueOnce(undefined)

    render(<UsuariosPage />, { wrapper })
    await screen.findByText('Juan Perez')

    fireEvent.click(screen.getByTitle('Restablecer contraseña'))
    expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nueva contraseña *'), { target: { value: 'Nueva1234!' } })
    fireEvent.click(screen.getByText('Restablecer'))

    await waitFor(() => expect(mockUsuariosService.resetPassword).toHaveBeenCalledWith(1, { nuevaContrasena: 'Nueva1234!' }))
  })
})
