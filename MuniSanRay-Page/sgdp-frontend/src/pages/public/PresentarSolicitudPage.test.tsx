import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PresentarSolicitudPage from './PresentarSolicitudPage'
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

describe('PresentarSolicitudPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renderiza el formulario correctamente', () => {
    render(<PresentarSolicitudPage />, { wrapper })

    expect(screen.getByText(/solicitud de información/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/dpi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('muestra errores de validación con datos inválidos', async () => {
    render(<PresentarSolicitudPage />, { wrapper })

    fireEvent.click(screen.getByRole('button', { name: /presentar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByText(/nombre debe tener/i)).toBeInTheDocument()
    })
  })

  it('muestra código de expediente tras éxito', async () => {
    const respuesta = {
      codigoExpediente: 'SOL-2026-0001',
      fechaRecepcion: '2026-08-17',
      fechaLimite: '2026-09-01',
      estado: 'PENDIENTE',
      mensaje: 'Solicitud registrada correctamente.',
    }
    mockPublicoService.presentarSolicitud.mockResolvedValueOnce(respuesta)

    render(<PresentarSolicitudPage />, { wrapper })

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Juan Pérez García' },
    })
    fireEvent.change(screen.getByLabelText(/dpi/i), {
      target: { value: '1234567890123' },
    })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'juan@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: {
        value: 'Solicitud de información sobre el presupuesto municipal del año en curso',
      },
    })

    fireEvent.click(screen.getByRole('button', { name: /presentar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByText('SOL-2026-0001')).toBeInTheDocument()
    })
  })

  it('deshabilita botón mientras se envía', async () => {
    mockPublicoService.presentarSolicitud.mockImplementationOnce(
      () => new Promise(() => {}),
    )

    render(<PresentarSolicitudPage />, { wrapper })

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Test Usuario' },
    })
    fireEvent.change(screen.getByLabelText(/dpi/i), {
      target: { value: '9876543210123' },
    })
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'test@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: {
        value: 'Solicitud de información sobre documentos públicos del municipio',
      },
    })

    fireEvent.click(screen.getByRole('button', { name: /presentar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /presentar solicitud/i })).toBeDisabled()
    })
  })
})
