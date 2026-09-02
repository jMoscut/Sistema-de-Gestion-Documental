import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import SeguimientoPage from './SeguimientoPage'
import { publicoService } from '../../services/publico.service'

jest.mock('../../services/publico.service')

const mockPublicoService = publicoService as jest.Mocked<typeof publicoService>

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const mockSeguimiento = {
  codigoExpediente: 'SOL-2026-0001',
  nombreSolicitante: 'Juan Pérez',
  fechaRecepcion: '2026-08-01',
  fechaLimite: '2026-08-15',
  estado: 'PENDIENTE' as const,
  fechaProrroga: undefined,
  fechaRespuesta: undefined,
}

describe('SeguimientoPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renderiza campo de búsqueda', () => {
    render(<SeguimientoPage />, { wrapper })

    expect(screen.getByPlaceholderText(/SOL-\d{4}-\d{4}/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /consultar/i })).toBeInTheDocument()
  })

  it('muestra resultado tras buscar código válido', async () => {
    mockPublicoService.consultarSeguimiento.mockResolvedValueOnce(mockSeguimiento)

    render(<SeguimientoPage />, { wrapper })

    fireEvent.change(screen.getByPlaceholderText(/SOL-\d{4}-\d{4}/i), {
      target: { value: 'SOL-2026-0001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText('SOL-2026-0001')).toBeInTheDocument()
      expect(screen.getByText('Juan P.')).toBeInTheDocument()
    })
  })

  it('muestra estado PENDIENTE con badge correcto', async () => {
    mockPublicoService.consultarSeguimiento.mockResolvedValueOnce(mockSeguimiento)

    render(<SeguimientoPage />, { wrapper })

    fireEvent.change(screen.getByPlaceholderText(/SOL-\d{4}-\d{4}/i), {
      target: { value: 'SOL-2026-0001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText(/pendiente/i)).toBeInTheDocument()
    })
  })

  it('muestra error cuando solicitud no existe', async () => {
    const notFoundError = Object.assign(new Error('Not Found'), { response: { status: 404 } })
    mockPublicoService.consultarSeguimiento.mockRejectedValueOnce(notFoundError)

    render(<SeguimientoPage />, { wrapper })

    fireEvent.change(screen.getByPlaceholderText(/SOL-\d{4}-\d{4}/i), {
      target: { value: 'SOL-FAKE' },
    })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText(/no se encontr/i)).toBeInTheDocument()
    })
  })

  it('muestra fecha de respuesta cuando estado es RESPONDIDA, sin exponer el texto de la respuesta', async () => {
    const respondida = {
      ...mockSeguimiento,
      estado: 'RESPONDIDA' as const,
      fechaRespuesta: '2026-08-14T10:30:00',
    }
    mockPublicoService.consultarSeguimiento.mockResolvedValueOnce(respondida)

    render(<SeguimientoPage />, { wrapper })

    fireEvent.change(screen.getByPlaceholderText(/SOL-\d{4}-\d{4}/i), {
      target: { value: 'SOL-2026-0001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /consultar/i }))

    await waitFor(() => {
      expect(screen.getByText(/respondida/i)).toBeInTheDocument()
      expect(screen.getByText(/fecha de respuesta/i)).toBeInTheDocument()
      expect(screen.getByText(/14\/08\/2026/)).toBeInTheDocument()
    })
  })
})
