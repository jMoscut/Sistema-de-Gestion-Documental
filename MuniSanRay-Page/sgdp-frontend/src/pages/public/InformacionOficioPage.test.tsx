import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import InformacionOficioPage from './InformacionOficioPage'
import { publicoService } from '../../services/publico.service'
import type { CategoriaOficioPublico, CarpetaOficioPublico, DocumentoOficioPublico } from '../../types/publico.types'

const mockPublicoService = publicoService as jest.Mocked<typeof publicoService>

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function crearCategoria(overrides: Partial<CategoriaOficioPublico> = {}): CategoriaOficioPublico {
  return { id: 1, seccion: 'LAIP', numero: 1, nombre: 'Estructura Orgánica', totalCarpetas: 2, ...overrides }
}

function crearCarpeta(overrides: Partial<CarpetaOficioPublico> = {}): CarpetaOficioPublico {
  return {
    id: 10, categoriaId: 1, categoriaNombre: 'Estructura Orgánica', nombre: 'Carpeta 2026',
    totalDocumentos: 1, createdAt: '2026-01-01T00:00:00', ...overrides,
  }
}

function crearDocumento(overrides: Partial<DocumentoOficioPublico> = {}): DocumentoOficioPublico {
  return {
    id: 100, carpetaId: 10, titulo: 'Organigrama Municipal', archivoNombre: 'organigrama.pdf',
    tamanoBytes: 51200, createdAt: '2026-01-01T00:00:00', ...overrides,
  }
}

describe('InformacionOficioPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('muestra las categorías de la sección LAIP por defecto', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValueOnce([crearCategoria()])

    render(<InformacionOficioPage />, { wrapper })

    expect(await screen.findByText('Estructura Orgánica')).toBeInTheDocument()
    expect(mockPublicoService.listarCategoriasV2).toHaveBeenCalledWith('LAIP')
  })

  it('muestra mensaje de error cuando falla la carga', async () => {
    mockPublicoService.listarCategoriasV2.mockRejectedValueOnce(new Error('network error'))

    render(<InformacionOficioPage />, { wrapper })

    expect(await screen.findByText('No se pudo cargar la información. Por favor intente de nuevo más tarde.')).toBeInTheDocument()
  })

  it('cambia de sección al hacer clic en una pestaña', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValue([crearCategoria({ seccion: 'COMUDE' })])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')

    fireEvent.click(screen.getByText('COMUDE'))

    await waitFor(() => expect(mockPublicoService.listarCategoriasV2).toHaveBeenLastCalledWith('COMUDE'))
  })

  it('filtra categorías por texto de búsqueda', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValue([
      crearCategoria({ id: 1, numero: 1, nombre: 'Estructura Orgánica' }),
      crearCategoria({ id: 2, numero: 2, nombre: 'Directorio' }),
    ])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')

    fireEvent.change(screen.getByPlaceholderText('Categoría, carpeta, documento…'), { target: { value: 'directorio' } })

    await waitFor(() => expect(screen.queryByText('Estructura Orgánica')).not.toBeInTheDocument())
    expect(screen.getAllByText('Directorio').length).toBeGreaterThan(0)
  })

  it('muestra sin resultados cuando el filtro no coincide con nada', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValue([crearCategoria()])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')

    fireEvent.change(screen.getByPlaceholderText('Categoría, carpeta, documento…'), { target: { value: 'xyz-inexistente' } })

    expect(await screen.findByText('Sin resultados para "xyz-inexistente"')).toBeInTheDocument()
  })

  it('expande una categoría y carga sus carpetas', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValueOnce([crearCategoria()])
    mockPublicoService.listarCarpetasV2.mockResolvedValueOnce([crearCarpeta()])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')

    fireEvent.click(screen.getByText('Estructura Orgánica'))

    expect(await screen.findByText('Carpeta 2026')).toBeInTheDocument()
    expect(mockPublicoService.listarCarpetasV2).toHaveBeenCalledWith(1)
  })

  it('categoría sin carpetas muestra mensaje de información no disponible', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValueOnce([crearCategoria()])
    mockPublicoService.listarCarpetasV2.mockResolvedValueOnce([])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')
    fireEvent.click(screen.getByText('Estructura Orgánica'))

    expect(await screen.findByText('Información no disponible aún.')).toBeInTheDocument()
  })

  it('expande una carpeta y carga sus documentos', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValueOnce([crearCategoria()])
    mockPublicoService.listarCarpetasV2.mockResolvedValueOnce([crearCarpeta()])
    mockPublicoService.listarDocumentosV2.mockResolvedValueOnce([crearDocumento()])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')
    fireEvent.click(screen.getByText('Estructura Orgánica'))
    fireEvent.click(await screen.findByText('Carpeta 2026'))

    expect(await screen.findByText('Organigrama Municipal')).toBeInTheDocument()
    expect(mockPublicoService.listarDocumentosV2).toHaveBeenCalledWith(10)
  })

  it('carpeta sin documentos muestra mensaje "Sin documentos."', async () => {
    mockPublicoService.listarCategoriasV2.mockResolvedValueOnce([crearCategoria()])
    mockPublicoService.listarCarpetasV2.mockResolvedValueOnce([crearCarpeta()])
    mockPublicoService.listarDocumentosV2.mockResolvedValueOnce([])

    render(<InformacionOficioPage />, { wrapper })
    await screen.findByText('Estructura Orgánica')
    fireEvent.click(screen.getByText('Estructura Orgánica'))
    fireEvent.click(await screen.findByText('Carpeta 2026'))

    expect(await screen.findByText('Sin documentos.')).toBeInTheDocument()
  })
})
