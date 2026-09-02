import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Topbar from './Topbar'
import { useAuth } from '../../context/AuthContext'
import { notificacionesService } from '../../services/notificaciones.service'

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('../../services/notificaciones.service')

const mockUseAuth = useAuth as jest.Mock
const mockNotificacionesService = notificacionesService as jest.Mocked<typeof notificacionesService>
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderTopbar(onMenuToggle: () => void, initialEntry = '/admin/dashboard') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Topbar onMenuToggle={onMenuToggle} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Topbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNotificacionesService.listar.mockResolvedValue([])
  })

  it('muestra el nombre y el rol traducido del usuario', () => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Juan Perez', rol: 'ADMINISTRADOR' }, logout: jest.fn() })
    renderTopbar(jest.fn())
    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('Administrador del Sistema')).toBeInTheDocument()
  })

  it('muestra breadcrumb según la ruta actual', () => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'OFICIAL' }, logout: jest.fn() })
    renderTopbar(jest.fn(), '/admin/solicitudes')
    expect(screen.getByText('Solicitudes LAIP')).toBeInTheDocument()
  })

  it('usa etiqueta Admin por defecto en ruta desconocida', () => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'OFICIAL' }, logout: jest.fn() })
    renderTopbar(jest.fn(), '/admin/ruta-rara')
    expect(screen.getAllByText('Admin').length).toBe(2)
  })

  it('handleLogout llama logout y navega a login', () => {
    const logoutMock = jest.fn()
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'OFICIAL' }, logout: logoutMock })
    renderTopbar(jest.fn())

    fireEvent.click(screen.getByTitle('Cerrar sesión'))

    expect(logoutMock).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/admin/login', { replace: true })
  })

  it('onMenuToggle se llama al hacer clic en el botón móvil', () => {
    const onMenuToggle = jest.fn()
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'OFICIAL' }, logout: jest.fn() })
    renderTopbar(onMenuToggle)

    fireEvent.click(screen.getByLabelText('Abrir menú'))

    expect(onMenuToggle).toHaveBeenCalledTimes(1)
  })

  it('sin usuario no muestra bloque de nombre/rol', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: jest.fn() })
    renderTopbar(jest.fn())
    expect(screen.queryByText('Administrador del Sistema')).not.toBeInTheDocument()
  })

  it('ADMINISTRADOR ve la campana de notificaciones', () => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'ADMINISTRADOR' }, logout: jest.fn() })
    renderTopbar(jest.fn())
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument()
  })

  it('FUNCIONARIO no ve la campana de notificaciones', () => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'FUNCIONARIO' }, logout: jest.fn() })
    renderTopbar(jest.fn())
    expect(screen.queryByLabelText('Notificaciones')).not.toBeInTheDocument()
  })
})
