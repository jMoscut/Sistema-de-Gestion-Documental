import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import SolicitudesPage from './SolicitudesPage'
import { solicitudesService } from '../../services/solicitudes.service'
import { useAuth } from '../../context/AuthContext'
import type { SolicitudAdminResponse, PageResponse } from '../../types/solicitudes.types'

jest.mock('../../services/solicitudes.service')
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockSolicitudesService = solicitudesService as jest.Mocked<typeof solicitudesService>
const mockUseAuth = useAuth as jest.Mock

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function crearSolicitud(overrides: Partial<SolicitudAdminResponse> = {}): SolicitudAdminResponse {
  return {
    id: 1,
    codigoExpediente: 'SOL-2026-0001',
    nombreSolicitante: 'Juan Pérez',
    descripcionSolicitud: 'Solicitud de prueba',
    fechaRecepcion: '2026-08-01',
    fechaLimite: '2026-08-15',
    estado: 'EN_PROCESO',
    oficialAsignadoId: 5,
    oficialAsignadoNombre: 'Oficial Cinco',
    diasRestantes: 5,
    createdAt: '2026-08-01T00:00:00',
    updatedAt: '2026-08-01T00:00:00',
    ...overrides,
  }
}

function mockPage(items: SolicitudAdminResponse[]): PageResponse<SolicitudAdminResponse> {
  return {
    content: items,
    totalElements: items.length,
    totalPages: 1,
    number: 0,
    size: 20,
    first: true,
    last: true,
  }
}

describe('SolicitudesPage — permisos por rol', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ADMINISTRADOR: no ve botones de prorrogar/denegar y responder aparece deshabilitado', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, rol: 'ADMINISTRADOR' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'EN_PROCESO', oficialAsignadoId: 5 })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()

    expect(screen.queryByTitle('Asignar oficial')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Prorrogar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Denegar')).not.toBeInTheDocument()

    const responderBtn = screen.getByTitle('El administrador solo puede ver y asignar')
    expect(responderBtn).toBeDisabled()
  })

  it('OFICIAL asignado: ve responder/prorrogar/denegar habilitados', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 5, rol: 'OFICIAL' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'EN_PROCESO', oficialAsignadoId: 5 })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()

    expect(screen.getByTitle('Responder')).toBeInTheDocument()
    expect(screen.getByTitle('Prorrogar')).toBeInTheDocument()
    expect(screen.getByTitle('Denegar')).toBeInTheDocument()
  })

  it('OFICIAL no asignado a la solicitud: no ve prorrogar/denegar y responder aparece deshabilitado', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 99, rol: 'OFICIAL' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'EN_PROCESO', oficialAsignadoId: 5 })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()

    expect(screen.queryByTitle('Prorrogar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Denegar')).not.toBeInTheDocument()

    const responderBtn = screen.getByTitle('Debe estar asignado a esta solicitud para responder')
    expect(responderBtn).toBeDisabled()
  })

  it('OFICIAL: no ve botón de asignar en solicitudes ya asignadas a otro oficial', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 99, rol: 'OFICIAL' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'RESPONDIDA', oficialAsignadoId: 5 })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()

    expect(screen.queryByTitle('Asignar oficial')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Prorrogar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Denegar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Responder')).not.toBeInTheDocument()
  })

  it('ADMINISTRADOR: sí ve el botón de asignar en solicitudes sin asignar', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, rol: 'ADMINISTRADOR' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'PENDIENTE', oficialAsignadoId: undefined })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()
    expect(screen.getByTitle('Asignar oficial')).toBeInTheDocument()
  })

  it('ADMINISTRADOR: no ve el botón de asignar en solicitud VENCIDA ya asignada', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, rol: 'ADMINISTRADOR' } })
    mockSolicitudesService.listar.mockResolvedValueOnce(
      mockPage([crearSolicitud({ estado: 'VENCIDA', oficialAsignadoId: 5 })]),
    )

    render(<SolicitudesPage />, { wrapper })

    expect(await screen.findByText('SOL-2026-0001')).toBeInTheDocument()
    expect(screen.queryByTitle('Asignar oficial')).not.toBeInTheDocument()
  })
})
