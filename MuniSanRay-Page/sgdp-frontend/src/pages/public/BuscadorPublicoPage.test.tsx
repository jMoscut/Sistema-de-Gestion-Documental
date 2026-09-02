import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BuscadorPublicoPage from './BuscadorPublicoPage'
import { publicoService } from '../../services/publico.service'
import type { DocumentoPublico, PageResponse } from '../../types/publico.types'

const mockPublicoService = publicoService as jest.Mocked<typeof publicoService>

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function crearDoc(overrides: Partial<DocumentoPublico> = {}): DocumentoPublico {
  return {
    id: 1,
    codigo: 'DOC-2026-0001',
    titulo: 'Presupuesto Municipal 2026',
    descripcion: 'Documento presupuestario',
    categoria: { id: 1, nombre: 'Presupuestaria', esLaip: true, activa: true },
    unidadOrigen: 'DAFIM',
    fechaEmision: '2026-01-15',
    nombreArchivo: 'presupuesto.pdf',
    tamanoBytes: 204800,
    createdAt: '2026-01-15T00:00:00',
    ...overrides,
  }
}

function crearPagina(items: DocumentoPublico[], overrides: Partial<PageResponse<DocumentoPublico>> = {}): PageResponse<DocumentoPublico> {
  return { content: items, totalElements: items.length, totalPages: 1, number: 0, size: 12, ...overrides }
}

describe('BuscadorPublicoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPublicoService.categoriasDocumentos.mockResolvedValue([
      { id: 1, nombre: 'Presupuestaria', esLaip: true, activa: true },
    ])
  })

  it('muestra documentos encontrados', async () => {
    mockPublicoService.buscarDocumentos.mockResolvedValueOnce(crearPagina([crearDoc()]))

    render(<BuscadorPublicoPage />, { wrapper })

    expect(await screen.findByText('Presupuesto Municipal 2026')).toBeInTheDocument()
    expect(screen.getByText('1 documento encontrado')).toBeInTheDocument()
  })

  it('muestra mensaje sin resultados', async () => {
    mockPublicoService.buscarDocumentos.mockResolvedValueOnce(crearPagina([]))

    render(<BuscadorPublicoPage />, { wrapper })

    expect(await screen.findByText('Sin documentos')).toBeInTheDocument()
    expect(screen.getByText('No hay documentos públicos disponibles aún.')).toBeInTheDocument()
  })

  it('busca por texto y muestra el término en el contador', async () => {
    mockPublicoService.buscarDocumentos.mockResolvedValue(crearPagina([crearDoc()]))

    render(<BuscadorPublicoPage />, { wrapper })
    await screen.findByText('Presupuesto Municipal 2026')

    fireEvent.change(screen.getByPlaceholderText('Buscar por título, descripción…'), { target: { value: 'presupuesto' } })
    fireEvent.click(screen.getByText('Buscar'))

    await waitFor(() =>
      expect(mockPublicoService.buscarDocumentos).toHaveBeenCalledWith({ q: 'presupuesto', categoriaId: null, page: 0, size: 12 }),
    )
  })

  it('limpiar búsqueda resetea el input', async () => {
    mockPublicoService.buscarDocumentos.mockResolvedValue(crearPagina([crearDoc()]))

    render(<BuscadorPublicoPage />, { wrapper })
    await screen.findByText('Presupuesto Municipal 2026')

    const input = screen.getByPlaceholderText('Buscar por título, descripción…') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'texto' } })
    expect(input.value).toBe('texto')

    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(input.value).toBe('')
  })

  it('cambia de página cuando hay múltiples páginas', async () => {
    mockPublicoService.buscarDocumentos.mockResolvedValue(crearPagina([crearDoc()], { totalPages: 3, totalElements: 30 }))

    render(<BuscadorPublicoPage />, { wrapper })
    await screen.findByText('Presupuesto Municipal 2026')

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
    const siguiente = screen.getByText('Siguiente')
    fireEvent.click(siguiente)

    await waitFor(() =>
      expect(mockPublicoService.buscarDocumentos).toHaveBeenCalledWith({ q: undefined, categoriaId: null, page: 1, size: 12 }),
    )
  })

  it('muestra alerta de error si la carga falla', async () => {
    mockPublicoService.buscarDocumentos.mockRejectedValueOnce(new Error('network error'))

    render(<BuscadorPublicoPage />, { wrapper })

    expect(await screen.findByText('No se pudo cargar los documentos. Intente más tarde.')).toBeInTheDocument()
  })
})
