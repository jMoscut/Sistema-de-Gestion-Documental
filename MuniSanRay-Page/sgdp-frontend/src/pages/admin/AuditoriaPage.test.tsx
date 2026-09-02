import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuditoriaPage from './AuditoriaPage'
import { auditoriaService } from '../../services/auditoria.service'
import type { AuditoriaResponse } from '../../types/auditoria.types'
import type { PageResponse } from '../../types/usuarios.types'

jest.mock('../../services/auditoria.service')

const mockAuditoriaService = auditoriaService as jest.Mocked<typeof auditoriaService>

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function crearEntry(overrides: Partial<AuditoriaResponse> = {}): AuditoriaResponse {
  return {
    id: 1,
    timestampUtc: '2026-08-15T14:23:11Z',
    usuarioDesc: 'admin1',
    ipOrigen: '127.0.0.1',
    accion: 'LOGIN_EXITOSO',
    objetoTipo: 'USUARIO',
    objetoId: '1',
    resultado: 'EXITO',
    ...overrides,
  }
}

function crearPagina(items: AuditoriaResponse[], overrides: Partial<PageResponse<AuditoriaResponse>> = {}): PageResponse<AuditoriaResponse> {
  return { content: items, totalElements: items.length, totalPages: 1, number: 0, size: 50, first: true, last: true, ...overrides }
}

describe('AuditoriaPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('muestra registros de auditoría', async () => {
    mockAuditoriaService.listar.mockResolvedValueOnce(crearPagina([crearEntry()]))

    render(<AuditoriaPage />, { wrapper })

    expect(await screen.findByText('admin1')).toBeInTheDocument()
    expect(screen.getAllByText('LOGIN_EXITOSO').length).toBeGreaterThan(0)
    expect(screen.getByText('EXITO')).toBeInTheDocument()
  })

  it('muestra mensaje sin registros', async () => {
    mockAuditoriaService.listar.mockResolvedValueOnce(crearPagina([]))

    render(<AuditoriaPage />, { wrapper })

    expect(await screen.findByText('No se encontraron registros')).toBeInTheDocument()
  })

  it('muestra error cuando falla la carga', async () => {
    mockAuditoriaService.listar.mockRejectedValueOnce(new Error('network error'))

    render(<AuditoriaPage />, { wrapper })

    expect(await screen.findByText('Error al cargar el registro de auditoría. Intente nuevamente.')).toBeInTheDocument()
  })

  it('filtra por acción y llama al servicio con el filtro', async () => {
    mockAuditoriaService.listar.mockResolvedValue(crearPagina([crearEntry()]))

    render(<AuditoriaPage />, { wrapper })
    await screen.findByText('admin1')

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'LOGIN_FALLIDO' } })
    fireEvent.click(screen.getByText('Filtrar'))

    await waitFor(() =>
      expect(mockAuditoriaService.listar).toHaveBeenLastCalledWith(
        expect.objectContaining({ accion: 'LOGIN_FALLIDO', size: 50 }),
      ),
    )
  })

  it('limpiar filtros resetea el formulario', async () => {
    mockAuditoriaService.listar.mockResolvedValue(crearPagina([crearEntry()]))

    render(<AuditoriaPage />, { wrapper })
    await screen.findByText('admin1')

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'LOGIN_FALLIDO' } })
    fireEvent.click(screen.getByText('Filtrar'))
    await waitFor(() => screen.getByText('Limpiar'))

    fireEvent.click(screen.getByText('Limpiar'))

    await waitFor(() =>
      expect(mockAuditoriaService.listar).toHaveBeenLastCalledWith(expect.objectContaining({ size: 50 })),
    )
    expect(screen.queryByText('Limpiar')).not.toBeInTheDocument()
  })

  it('abre y cierra el modal de detalle', async () => {
    mockAuditoriaService.listar.mockResolvedValueOnce(
      crearPagina([crearEntry({ detalle: '{"estado":"activado"}' })]),
    )

    render(<AuditoriaPage />, { wrapper })
    await screen.findByText('admin1')

    fireEvent.click(screen.getByText('Ver'))
    expect(screen.getByRole('heading', { name: 'Detalle' })).toBeInTheDocument()
    expect(screen.getByText(/activado/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(screen.queryByRole('heading', { name: 'Detalle' })).not.toBeInTheDocument()
  })

  it('pagina hacia adelante cuando hay múltiples páginas', async () => {
    mockAuditoriaService.listar.mockResolvedValue(
      crearPagina([crearEntry()], { totalPages: 3, totalElements: 120, number: 0 }),
    )

    render(<AuditoriaPage />, { wrapper })
    await screen.findByText('admin1')

    expect(screen.getByText(/Página 1 de 3/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Siguiente'))

    await waitFor(() =>
      expect(mockAuditoriaService.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })),
    )
  })
})
