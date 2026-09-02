import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from './DashboardPage'
import { dashboardService } from '../../services/dashboard.service'
import { useAuth } from '../../hooks/useAuth'
import type { DashboardStats, MetaModulo } from '../../types/dashboard.types'

jest.mock('../../services/dashboard.service')
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>
const mockUseAuth = useAuth as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function stats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    solicitudesPendientes: 3,
    solicitudesEnProceso: 5,
    solicitudesRespondidas: 10,
    solicitudesTotal: 18,
    documentosTotal: 42,
    oficioPublicadas: 20,
    porcentajeCumplimiento: 68,
    carpetasDesactualizadasCount: 0,
    carpetasDesactualizadas: [],
    ...overrides,
  }
}

function meta(overrides: Partial<MetaModulo> = {}): MetaModulo {
  return {
    modulo: 'DOCUMENTOS',
    etiqueta: 'Repositorio Documental',
    tipoMetrica: 'TOTAL_DOCUMENTOS',
    actual: 40,
    meta: 100,
    porcentaje: 40,
    ...overrides,
  }
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('muestra estadísticas cuando cargan', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'FUNCIONARIO' } })
    mockDashboardService.getStats.mockResolvedValueOnce(stats())
    mockDashboardService.getMetas.mockResolvedValueOnce([meta()])

    render(<DashboardPage />, { wrapper })

    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
  })

  it('no muestra alerta de carpetas desactualizadas cuando count es 0', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockDashboardService.getStats.mockResolvedValueOnce(stats({ carpetasDesactualizadasCount: 0 }))
    mockDashboardService.getMetas.mockResolvedValueOnce([])

    render(<DashboardPage />, { wrapper })

    await screen.findByText('Dashboard')
    expect(screen.queryByText(/carpeta.*sin actualizar/)).not.toBeInTheDocument()
  })

  it('muestra alerta y expande carpetas desactualizadas', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockDashboardService.getStats.mockResolvedValueOnce(
      stats({ carpetasDesactualizadasCount: 2, carpetasDesactualizadas: ['Carpeta A', 'Carpeta B'] }),
    )
    mockDashboardService.getMetas.mockResolvedValueOnce([])

    render(<DashboardPage />, { wrapper })

    expect(await screen.findByText(/2 carpetas de oficio sin actualizar/)).toBeInTheDocument()
    expect(screen.queryByText('Carpeta A')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Ver carpetas'))

    expect(screen.getByText('Carpeta A')).toBeInTheDocument()
    expect(screen.getByText('Carpeta B')).toBeInTheDocument()
  })

  it('ADMINISTRADOR puede editar la meta de un módulo', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockDashboardService.getStats.mockResolvedValueOnce(stats())
    mockDashboardService.getMetas.mockResolvedValueOnce([meta()])
    mockDashboardService.actualizarMeta.mockResolvedValueOnce(meta({ meta: 150 }))

    render(<DashboardPage />, { wrapper })

    const editBtn = await screen.findByTitle('Editar meta')
    fireEvent.click(editBtn)

    const input = screen.getByDisplayValue('100')
    fireEvent.change(input, { target: { value: '150' } })
    fireEvent.click(screen.getByTitle('Guardar'))

    await waitFor(() => expect(mockDashboardService.actualizarMeta).toHaveBeenCalledWith('DOCUMENTOS', 150))
  })

  it('FUNCIONARIO no ve el ícono de editar meta', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'FUNCIONARIO' } })
    mockDashboardService.getStats.mockResolvedValueOnce(stats())
    mockDashboardService.getMetas.mockResolvedValueOnce([meta()])

    render(<DashboardPage />, { wrapper })

    await screen.findByText('Repositorio Documental')
    expect(screen.queryByTitle('Editar meta')).not.toBeInTheDocument()
  })

  it('cancelar edición de meta oculta el input', async () => {
    mockUseAuth.mockReturnValue({ user: { rol: 'ADMINISTRADOR' } })
    mockDashboardService.getStats.mockResolvedValueOnce(stats())
    mockDashboardService.getMetas.mockResolvedValueOnce([meta()])

    render(<DashboardPage />, { wrapper })

    fireEvent.click(await screen.findByTitle('Editar meta'))
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Cancelar'))

    expect(screen.queryByDisplayValue('100')).not.toBeInTheDocument()
  })
})
