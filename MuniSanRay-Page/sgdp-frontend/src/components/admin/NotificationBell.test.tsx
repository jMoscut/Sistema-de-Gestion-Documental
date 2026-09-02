import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import NotificationBell from './NotificationBell'
import { notificacionesService } from '../../services/notificaciones.service'
import type { NotificacionResponse } from '../../types/notificaciones.types'

jest.mock('../../services/notificaciones.service')
const mockNotificacionesService = notificacionesService as jest.Mocked<typeof notificacionesService>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderBell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('no muestra badge cuando no hay notificaciones', async () => {
    mockNotificacionesService.listar.mockResolvedValueOnce([])
    renderBell()
    await waitFor(() => expect(mockNotificacionesService.listar).toHaveBeenCalled())
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('muestra el conteo de notificaciones en el badge', async () => {
    const items: NotificacionResponse[] = [
      { tipo: 'SOLICITUD_POR_VENCER', titulo: 'Próxima a vencer', mensaje: 'SOL-2026-0001 vence en 2 días', referenciaId: 1, codigoExpediente: 'SOL-2026-0001', diasRestantes: 2 },
      { tipo: 'SOLICITUD_VENCIDA', titulo: 'Vencida', mensaje: 'SOL-2026-0002 venció', referenciaId: 2, codigoExpediente: 'SOL-2026-0002' },
    ]
    mockNotificacionesService.listar.mockResolvedValueOnce(items)
    renderBell()

    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('abre el dropdown y muestra las notificaciones', async () => {
    mockNotificacionesService.listar.mockResolvedValueOnce([
      { tipo: 'OFICIO_DESACTUALIZADO', titulo: 'Oficio desactualizado', mensaje: 'LAIP › Carpeta X sin actualizar', referenciaId: 5 },
    ])
    renderBell()
    await waitFor(() => expect(mockNotificacionesService.listar).toHaveBeenCalled())

    fireEvent.click(screen.getByLabelText('Notificaciones'))

    expect(await screen.findByText('Oficio desactualizado')).toBeInTheDocument()
  })

  it('click en notificación de solicitud navega a /admin/solicitudes', async () => {
    mockNotificacionesService.listar.mockResolvedValueOnce([
      { tipo: 'SOLICITUD_VENCIDA', titulo: 'Vencida', mensaje: 'SOL-2026-0002 venció', referenciaId: 2, codigoExpediente: 'SOL-2026-0002' },
    ])
    renderBell()
    fireEvent.click(screen.getByLabelText('Notificaciones'))
    fireEvent.click(await screen.findByText('Vencida'))

    expect(mockNavigate).toHaveBeenCalledWith('/admin/solicitudes')
  })

  it('click en notificación de oficio navega a /admin/oficio', async () => {
    mockNotificacionesService.listar.mockResolvedValueOnce([
      { tipo: 'OFICIO_DESACTUALIZADO', titulo: 'Oficio desactualizado', mensaje: 'LAIP › Carpeta X', referenciaId: 5 },
    ])
    renderBell()
    fireEvent.click(screen.getByLabelText('Notificaciones'))
    fireEvent.click(await screen.findByText('Oficio desactualizado'))

    expect(mockNavigate).toHaveBeenCalledWith('/admin/oficio')
  })

  it('muestra mensaje cuando no hay notificaciones al abrir el dropdown', async () => {
    mockNotificacionesService.listar.mockResolvedValueOnce([])
    renderBell()
    await waitFor(() => expect(mockNotificacionesService.listar).toHaveBeenCalled())

    fireEvent.click(screen.getByLabelText('Notificaciones'))

    expect(await screen.findByText('Sin notificaciones pendientes')).toBeInTheDocument()
  })
})
