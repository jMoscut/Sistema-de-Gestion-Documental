import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { BookOpen, ChevronDown, ChevronRight, Folder, FileText, Download, Search, X, CheckCircle2 } from 'lucide-react'
import { publicoService } from '../../services/publico.service'
import type { CarpetaOficioPublico, DocumentoOficioPublico, CategoriaOficioPublico, OficioBusquedaResultado } from '../../types/publico.types'
import Spinner from '../../components/common/Spinner'
import Alert from '../../components/common/Alert'

// ── Sections ──────────────────────────────────────────────────────────────────

const SECCIONES = [
  { key: 'LAIP',              label: 'Art. 10 LAIP',    hero: 'Decreto 57-2008 Art. 10', total: 29 },
  { key: 'COMUDE',            label: 'COMUDE',           hero: 'Información del COMUDE', total: null },
  { key: 'PRESUPUESTARIA',    label: 'Presupuestaria',   hero: 'Transparencia Presupuestaria', total: null },
  { key: 'SINACIG',           label: 'SINACIG',          hero: 'Control Interno Gubernamental', total: null },
  { key: 'RENDICION_CUENTAS', label: 'Rendición',        hero: 'Rendición de Cuentas', total: null },
  { key: 'DECRETO_101_97',    label: 'Decreto 101-97',   hero: 'Decreto 101-97 Art. 17 Ter', total: null },
  { key: 'DECRETO_36_2024',   label: 'Decreto 36-2024',  hero: 'Decreto 36-2024', total: null },
] as const
type SeccionKey = typeof SECCIONES[number]['key']

// ── Documents list ────────────────────────────────────────────────────────────

function DocumentosList({ carpetaId }: { carpetaId: number }) {
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['publico-docs', carpetaId],
    queryFn: () => publicoService.listarDocumentosV2(carpetaId),
  })

  if (isLoading) return <div className="py-3 pl-6"><Spinner size="sm" /></div>
  if (docs.length === 0) return <div className="py-3 pl-6 text-xs text-gray-400">Sin documentos.</div>

  return (
    <div className="divide-y divide-gray-50">
      {docs.map((doc: DocumentoOficioPublico) => (
        <div key={doc.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 rounded-md bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
            <FileText size={14} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{doc.titulo}</p>
            {doc.descripcion && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.descripcion}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              {doc.archivoNombre} · {(doc.tamanoBytes / 1024).toFixed(0)} KB ·{' '}
              {format(parseISO(doc.createdAt), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
          <a
            href={publicoService.urlDocumentoV2(doc.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-600 shrink-0 mt-1 transition-colors"
          >
            <Download size={13} /> Ver PDF
          </a>
        </div>
      ))}
    </div>
  )
}

// ── Carpeta accordion item ────────────────────────────────────────────────────

function CarpetaItem({ carpeta, autoOpen }: { carpeta: CarpetaOficioPublico; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (autoOpen) setOpen(true)
  }, [autoOpen])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <Folder size={16} className={`shrink-0 ${autoOpen ? 'text-accent' : 'text-primary'}`} />
        <span className="flex-1 text-sm font-medium text-gray-800 truncate">{carpeta.nombre}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {carpeta.totalDocumentos} doc{carpeta.totalDocumentos !== 1 ? 's' : ''}
        </span>
        {open ? <ChevronDown size={15} className="text-gray-400 shrink-0" /> : <ChevronRight size={15} className="text-gray-400 shrink-0" />}
      </button>
      {open && <DocumentosList carpetaId={carpeta.id} />}
    </div>
  )
}

// ── Category accordion item ───────────────────────────────────────────────────

function CategoriaItem({
  id, numero, nombre, totalCarpetas, highlight, autoOpen, autoOpenCarpetaId,
}: {
  id: number; numero: number; nombre: string; totalCarpetas: number
  highlight?: boolean; autoOpen?: boolean; autoOpenCarpetaId?: number | null
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (autoOpen) setOpen(true)
  }, [autoOpen])

  const { data: carpetas = [], isLoading } = useQuery({
    queryKey: ['publico-carpetas', id],
    queryFn: () => publicoService.listarCarpetasV2(id),
    enabled: open,
  })

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${highlight ? 'border-primary/40 ring-1 ring-primary/20' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
          {numero}
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-900">{nombre}</span>
        <span className="text-xs text-gray-400 shrink-0">
          {totalCarpetas > 0 ? `${totalCarpetas} carpeta${totalCarpetas !== 1 ? 's' : ''}` : 'Sin contenido'}
        </span>
        {open ? <ChevronDown size={16} className="text-primary shrink-0" /> : <ChevronRight size={16} className="text-gray-300 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : carpetas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Información no disponible aún.</p>
          ) : (
            <div className="space-y-2">
              {carpetas.map((c: CarpetaOficioPublico) => (
                <CarpetaItem key={c.id} carpeta={c} autoOpen={autoOpenCarpetaId === c.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Right sidebar search panel ────────────────────────────────────────────────

function SearchPanel({
  categorias, search, seccion, onSearch, onSelectResult,
}: {
  categorias: CategoriaOficioPublico[]
  search: string
  seccion: string
  onSearch: (v: string) => void
  onSelectResult: (categoriaNumero: number, carpetaId?: number) => void
}) {
  const [debounced, setDebounced] = useState('')
  const conContenido = categorias.filter((c) => c.totalCarpetas > 0)
  const seccionInfo = SECCIONES.find((s) => s.key === seccion)!

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data: deepResults = [], isFetching } = useQuery({
    queryKey: ['oficio-buscar', debounced, seccion],
    queryFn: () => publicoService.buscarOficio(debounced, seccion),
    enabled: debounced.trim().length >= 2,
  })

  const catMatch = search.trim().length >= 1
    ? categorias.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    : []

  const showResults = search.trim().length >= 2

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Buscar</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Categoría, carpeta, documento…"
            className="w-full pl-8 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {showResults && (
          <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
            {catMatch.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-1 pt-1 pb-0.5 font-medium">Categorías</p>
                {catMatch.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectResult(c.numero)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 text-left group"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {c.numero}
                    </span>
                    <span className="text-xs text-gray-700 group-hover:text-primary truncate">{c.nombre}</span>
                  </button>
                ))}
              </>
            )}

            {isFetching && (
              <p className="text-xs text-gray-400 px-2 py-2">Buscando en carpetas y documentos…</p>
            )}
            {!isFetching && deepResults.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-1 pt-2 pb-0.5 font-medium">Carpetas y documentos</p>
                {deepResults.map((r: OficioBusquedaResultado, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectResult(r.categoriaNumero, r.carpetaId)}
                    className="w-full flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-primary/5 text-left group"
                  >
                    {r.tipo === 'CARPETA'
                      ? <Folder size={13} className="text-primary shrink-0 mt-0.5" />
                      : <FileText size={13} className="text-red-400 shrink-0 mt-0.5" />}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 group-hover:text-primary truncate">
                        {r.tipo === 'CARPETA' ? r.carpetaNombre : r.documentoTitulo}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {r.categoriaNumero}. {r.categoriaNombre}
                        {r.tipo === 'DOCUMENTO' && ` › ${r.carpetaNombre}`}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {!isFetching && catMatch.length === 0 && deepResults.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-2">Sin resultados para "{search}"</p>
            )}
          </div>
        )}
      </div>

      {/* Categories with content */}
      {!showResults && conContenido.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Con documentos publicados</p>
          <div className="space-y-1">
            {conContenido.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectResult(c.numero)}
                className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-colors group"
              >
                <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                <span className="text-xs font-medium text-gray-700 group-hover:text-primary truncate flex-1">
                  {c.numero}. {c.nombre}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{c.totalCarpetas}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats — only LAIP has fixed total */}
      {!showResults && (
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Publicaciones</p>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-2xl font-bold text-primary">{conContenido.length}</span>
            {seccionInfo.total && (
              <span className="text-sm text-primary/60 mb-0.5">/ {seccionInfo.total}</span>
            )}
          </div>
          {seccionInfo.total && (
            <div className="w-full bg-primary/20 rounded-full h-2">
              <div className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.round((conContenido.length / seccionInfo.total) * 100)}%` }} />
            </div>
          )}
          <p className="text-xs text-primary/60 mt-1">
            categoría{conContenido.length !== 1 ? 's' : ''} con información publicada
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InformacionOficioPage() {
  const [activeSeccion, setActiveSeccion] = useState<SeccionKey>('LAIP')
  const [search, setSearch] = useState('')
  const [autoOpenCatNumero, setAutoOpenCatNumero] = useState<number | null>(null)
  const [autoOpenCarpetaId, setAutoOpenCarpetaId] = useState<number | null>(null)

  const seccionInfo = SECCIONES.find((s) => s.key === activeSeccion)!

  const { data: categorias = [], isLoading, error } = useQuery({
    queryKey: ['publico-categorias', activeSeccion],
    queryFn: () => publicoService.listarCategoriasV2(activeSeccion),
  })

  const handleTabChange = (s: SeccionKey) => {
    if (s === activeSeccion) return
    setActiveSeccion(s)
    setSearch('')
    setAutoOpenCatNumero(null)
    setAutoOpenCarpetaId(null)
  }

  const filtered = search.trim()
    ? categorias.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()))
    : categorias

  const handleSelectResult = (categoriaNumero: number, carpetaId?: number) => {
    setSearch('')
    setAutoOpenCatNumero(categoriaNumero)
    setAutoOpenCarpetaId(carpetaId ?? null)
    setTimeout(() => {
      document.getElementById(`cat-${activeSeccion}-${categoriaNumero}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-primary text-white py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-7 h-7 text-accent" />
            <span className="text-accent text-sm font-semibold uppercase tracking-wide">
              {seccionInfo.hero}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Información Pública de Oficio</h1>
          <p className="text-primary-200 text-base max-w-2xl">
            Información que la municipalidad publica de forma proactiva en cumplimiento de la Ley de Acceso
            a la Información Pública y demás normativa aplicable.
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {SECCIONES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleTabChange(s.key)}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeSeccion === s.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading && <div className="flex justify-center py-16"><Spinner size="lg" /></div>}

        {error && (
          <Alert type="error">No se pudo cargar la información. Por favor intente de nuevo más tarde.</Alert>
        )}

        {!isLoading && !error && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: category list */}
            <div className="flex-1 min-w-0 w-full order-2 lg:order-1">
              {search.trim() && (
                <p className="text-xs text-gray-400 mb-4">
                  Mostrando {filtered.length} de {categorias.length} categorías para "{search}"
                </p>
              )}

              {filtered.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <BookOpen size={36} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">Sin resultados para "{search}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((cat) => (
                    <div key={cat.id} id={`cat-${activeSeccion}-${cat.numero}`}>
                      <CategoriaItem
                        id={cat.id}
                        numero={cat.numero}
                        nombre={cat.nombre}
                        totalCarpetas={cat.totalCarpetas}
                        highlight={!!search.trim()}
                        autoOpen={autoOpenCatNumero === cat.numero}
                        autoOpenCarpetaId={autoOpenCatNumero === cat.numero ? autoOpenCarpetaId : null}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: search + stats panel */}
            <div className="w-full lg:w-72 shrink-0 order-1 lg:order-2 lg:sticky lg:top-20">
              <SearchPanel
                categorias={categorias}
                search={search}
                seccion={activeSeccion}
                onSearch={setSearch}
                onSelectResult={handleSelectResult}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
