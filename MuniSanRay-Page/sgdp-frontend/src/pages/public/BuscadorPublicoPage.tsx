import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, FileText, Download, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { publicoService } from '../../services/publico.service'
import type { DocumentoPublico } from '../../types/publico.types'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function DocumentoCard({ doc }: { doc: DocumentoPublico }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
        <FileText size={20} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{doc.titulo}</p>
            {doc.descripcion && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.descripcion}</p>
            )}
          </div>
          <a
            href={publicoService.urlDescargarDocumentoPublico(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-primary hover:text-primary-600 bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Download size={13} /> Descargar
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {doc.categoria && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {doc.categoria.nombre}
            </span>
          )}
          <span className="text-xs text-gray-400">{doc.unidadOrigen}</span>
          <span className="text-xs text-gray-400">
            {format(parseISO(doc.fechaEmision), 'dd/MM/yyyy', { locale: es })}
          </span>
          <span className="text-xs text-gray-400">{doc.nombreArchivo}</span>
          <span className="text-xs text-gray-400">{formatBytes(doc.tamanoBytes)}</span>
        </div>
      </div>
    </div>
  )
}

export default function BuscadorPublicoPage() {
  const [q, setQ] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [page, setPage] = useState(0)

  const { data: categorias = [] } = useQuery({
    queryKey: ['publico-categorias-doc'],
    queryFn: publicoService.categoriasDocumentos,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['publico-docs', q, categoriaId, page],
    queryFn: () => publicoService.buscarDocumentos({ q: q || undefined, categoriaId, page, size: 12 }),
  })

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setQ(inputVal)
    setPage(0)
  }, [inputVal])

  const handleClearSearch = () => {
    setInputVal('')
    setQ('')
    setPage(0)
  }

  const handleCategoriaChange = (val: string) => {
    setCategoriaId(val ? Number(val) : null)
    setPage(0)
  }

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <>
      {/* Hero */}
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-6 h-6 text-accent" />
            <span className="text-accent text-sm font-semibold uppercase tracking-wide">
              Repositorio Público
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Buscar Documentos</h1>
          <p className="text-primary-200 text-base max-w-2xl">
            Repositorio de documentos municipales de acceso público. Busca por título, descripción
            o contenido.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search bar + filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Buscar por título, descripción…"
                className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {inputVal && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shrink-0"
            >
              Buscar
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select
              value={categoriaId ?? ''}
              onChange={(e) => handleCategoriaChange(e.target.value)}
              className="flex-1 min-w-0 sm:flex-none sm:max-w-xs text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-700"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {(q || categoriaId) && (
              <button
                onClick={() => { handleClearSearch(); setCategoriaId(null) }}
                className="text-xs text-gray-400 hover:text-gray-600 underline shrink-0"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert type="error">No se pudo cargar los documentos. Intente más tarde.</Alert>
        ) : (
          <>
            {/* Result count */}
            <p className="text-xs text-gray-400 mb-4">
              {totalElements === 0
                ? 'Sin resultados'
                : `${totalElements} documento${totalElements !== 1 ? 's' : ''} encontrado${totalElements !== 1 ? 's' : ''}`}
              {q && ` para "${q}"`}
            </p>

            {data?.content.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <FileText size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">Sin documentos</p>
                <p className="text-xs text-gray-400 mt-1">
                  {q
                    ? 'Prueba con otros términos de búsqueda.'
                    : 'No hay documentos públicos disponibles aún.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.content.map((doc: DocumentoPublico) => (
                  <DocumentoCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-xs text-gray-400">
                  Página {page + 1} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary/40 transition-colors"
                  >
                    <ChevronLeft size={15} /> Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary/40 transition-colors"
                  >
                    Siguiente <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
