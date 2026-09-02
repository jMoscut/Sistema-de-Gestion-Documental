import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronRight, FolderOpen, Folder, FileText,
  Plus, Pencil, Trash2, Download, X, ArrowLeft, Upload, Search,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import { oficioService } from '../../services/oficio.service'
import type {
  CategoriaOficioResponse,
  CarpetaOficioResponse,
  DocumentoOficioResponse,
  CrearCarpetaRequest,
  SubirDocumentoRequest,
  OficioBusquedaResultado,
} from '../../types/oficio.types'

// ── Sections ──────────────────────────────────────────────────────────────────

const SECCIONES = [
  { key: 'LAIP',             label: 'Art. 10 LAIP',    desc: '29 categorías · Decreto 57-2008' },
  { key: 'COMUDE',           label: 'COMUDE',           desc: 'Información del COMUDE' },
  { key: 'PRESUPUESTARIA',   label: 'Presupuestaria',   desc: 'Transparencia Presupuestaria' },
  { key: 'SINACIG',          label: 'SINACIG',          desc: 'Control Interno Gubernamental' },
  { key: 'RENDICION_CUENTAS',label: 'Rendición',        desc: 'Rendición de Cuentas' },
  { key: 'DECRETO_101_97',   label: 'Decreto 101-97',   desc: 'Art. 17 Ter' },
  { key: 'DECRETO_36_2024',  label: 'Decreto 36-2024',  desc: '' },
] as const
type SeccionKey = typeof SECCIONES[number]['key']

// ── Categoria Modal ───────────────────────────────────────────────────────────

const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(200),
})
type CategoriaForm = z.infer<typeof categoriaSchema>

function CategoriaModal({
  seccion, existing, onClose,
}: {
  seccion: string
  existing?: CategoriaOficioResponse
  onClose: () => void
}) {
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: (data: CategoriaForm) =>
      existing
        ? oficioService.actualizarCategoria(existing.id, { seccion, nombre: data.nombre })
        : oficioService.crearCategoria({ seccion, nombre: data.nombre }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-categorias', seccion] })
      onClose()
    },
  })
  const { register, handleSubmit, formState: { errors } } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: existing?.nombre ?? '' },
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{existing ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="p-5 space-y-4">
          <Input label="Nombre *" {...register('nombre')} error={errors.nombre} placeholder="Ej. Actas de Sesión" />
          {mut.isError && <p className="text-xs text-red-600">Error al guardar. Intente nuevamente.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={mut.isPending}>{existing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Schema ────────────────────────────────────────────────────────────────────

const carpetaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(200),
  descripcion: z.string().max(500).optional(),
})
type CarpetaForm = z.infer<typeof carpetaSchema>

const docSchema = z.object({
  titulo: z.string().min(1, 'Título obligatorio').max(300),
  descripcion: z.string().max(500).optional(),
})
type DocForm = z.infer<typeof docSchema>

// ── Carpeta Modal ─────────────────────────────────────────────────────────────

function CarpetaModal({ catId, existing, onClose }: { catId: number; existing?: CarpetaOficioResponse; onClose: () => void }) {
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: (data: CrearCarpetaRequest) =>
      existing ? oficioService.actualizarCarpeta(existing.id, data) : oficioService.crearCarpeta(catId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-carpetas', catId] })
      onClose()
    },
  })
  const { register, handleSubmit, formState: { errors } } = useForm<CarpetaForm>({
    resolver: zodResolver(carpetaSchema),
    defaultValues: { nombre: existing?.nombre ?? '', descripcion: existing?.descripcion ?? '' },
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{existing ? 'Editar carpeta' : 'Nueva carpeta'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="p-5 space-y-4">
          <Input label="Nombre *" {...register('nombre')} error={errors.nombre} placeholder="Ej. Año 2026 — Q1" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <textarea {...register('descripcion')} rows={3} placeholder="Información adicional…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          {mut.isError && <p className="text-xs text-red-600">Error al guardar. Intente nuevamente.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={mut.isPending}>{existing ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Documento Upload Modal ────────────────────────────────────────────────────

function SubirDocumentoModal({ carpetaId, onClose }: { carpetaId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [archivo, setArchivo] = useState<File | null>(null)
  const mut = useMutation({
    mutationFn: ({ data, file }: { data: SubirDocumentoRequest; file: File }) =>
      oficioService.subirDocumento(carpetaId, data, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-docs', carpetaId] })
      onClose()
    },
  })
  const { register, handleSubmit, formState: { errors } } = useForm<DocForm>({ resolver: zodResolver(docSchema) })
  const onSubmit = (values: DocForm) => {
    if (!archivo) return
    mut.mutate({ data: { titulo: values.titulo, descripcion: values.descripcion }, file: archivo })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Subir documento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <Input label="Título *" {...register('titulo')} error={errors.titulo} placeholder="Ej. Estructura Orgánica 2026" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
            <textarea {...register('descripcion')} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Archivo PDF *</label>
            <input type="file" accept="application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
            {archivo && <p className="text-xs text-green-700">{archivo.name} ({(archivo.size / 1024).toFixed(0)} KB)</p>}
          </div>
          {mut.isError && <p className="text-xs text-red-600">Error al subir. Intente nuevamente.</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={mut.isPending} disabled={!archivo}><Upload size={14} /> Subir</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm Delete ────────────────────────────────────────────────────────────

function ConfirmDeleteModal({ message, onConfirm, onCancel, loading }: { message: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">¿Eliminar?</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>Eliminar</Button>
        </div>
      </div>
    </div>
  )
}

// ── View: Document List ───────────────────────────────────────────────────────

function DocumentosView({ carpeta, onBack }: { carpeta: CarpetaOficioResponse; onBack: () => void }) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const puedeGestionar = user?.rol === 'ADMINISTRADOR' || user?.rol === 'OFICIAL'
  const [showUpload, setShowUpload] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocumentoOficioResponse | null>(null)

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['oficio-docs', carpeta.id],
    queryFn: () => oficioService.listarDocumentos(carpeta.id),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => oficioService.eliminarDocumento(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-docs', carpeta.id] })
      qc.invalidateQueries({ queryKey: ['oficio-carpetas', carpeta.categoriaId] })
      setConfirmDelete(null)
    },
  })

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-primary hover:text-primary-600 font-medium">
          <ArrowLeft size={14} /> Carpetas
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 font-medium truncate">{carpeta.nombre}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{carpeta.nombre}</h2>
          {carpeta.descripcion && <p className="text-sm text-gray-500 mt-0.5">{carpeta.descripcion}</p>}
        </div>
        {puedeGestionar && (
          <Button onClick={() => setShowUpload(true)}><Plus size={14} /> Subir PDF</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium">Sin documentos</p>
          <p className="text-xs mt-1">Sube el primer PDF para esta carpeta.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{doc.titulo}</p>
                {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.descripcion}</p>}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400">{doc.archivoNombre}</span>
                  <span className="text-xs text-gray-400">{(doc.tamanoBytes / 1024).toFixed(0)} KB</span>
                  <span className="text-xs text-gray-400">
                    {format(parseISO(doc.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    {doc.subidoPorNombre ? ` · ${doc.subidoPorNombre}` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => oficioService.descargarDocumento(doc.id, doc.archivoNombre)}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Descargar">
                  <Download size={15} />
                </button>
                {puedeGestionar && (
                  <button onClick={() => setConfirmDelete(doc)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {puedeGestionar && showUpload && <SubirDocumentoModal carpetaId={carpeta.id} onClose={() => setShowUpload(false)} />}
      {puedeGestionar && confirmDelete && (
        <ConfirmDeleteModal
          message={`Se eliminará el documento "${confirmDelete.titulo}" permanentemente.`}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  )
}

// ── View: Folder List ─────────────────────────────────────────────────────────

function CarpetasView({
  categoria, seccion, onBack, onSelectCarpeta,
}: {
  categoria: CategoriaOficioResponse
  seccion: string
  onBack: () => void
  onSelectCarpeta: (c: CarpetaOficioResponse) => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const puedeGestionar = user?.rol === 'ADMINISTRADOR' || user?.rol === 'OFICIAL'
  const [carpetaModal, setCarpetaModal] = useState<{ existing?: CarpetaOficioResponse } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CarpetaOficioResponse | null>(null)

  const { data: carpetas = [], isLoading } = useQuery({
    queryKey: ['oficio-carpetas', categoria.id],
    queryFn: () => oficioService.listarCarpetas(categoria.id),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => oficioService.eliminarCarpeta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-carpetas', categoria.id] })
      qc.invalidateQueries({ queryKey: ['oficio-categorias', seccion] })
      setConfirmDelete(null)
    },
  })

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-primary hover:text-primary-600 font-medium">
          <ArrowLeft size={14} /> Categorías
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-gray-700 font-medium">{categoria.numero}. {categoria.nombre}</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{categoria.nombre}</h2>
        {puedeGestionar && (
          <Button onClick={() => setCarpetaModal({})}><Plus size={14} /> Nueva carpeta</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : carpetas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium">Sin carpetas</p>
          <p className="text-xs mt-1">Crea una carpeta para organizar los documentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {carpetas.map((c) => (
            <div key={c.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              onClick={() => onSelectCarpeta(c)}>
              <div className="p-4 flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Folder size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.descripcion}</p>}
                  <p className="text-xs text-gray-400 mt-1">{c.totalDocumentos} documento{c.totalDocumentos !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-1">
                <span className="flex-1 text-xs text-gray-400">
                  {format(parseISO(c.createdAt), 'dd/MM/yyyy', { locale: es })}
                  {c.creadoPorNombre ? ` · ${c.creadoPorNombre}` : ''}
                </span>
                {puedeGestionar && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); setCarpetaModal({ existing: c }) }}
                      className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
                      <Pencil size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(c) }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {puedeGestionar && carpetaModal !== null && (
        <CarpetaModal catId={categoria.id} existing={carpetaModal.existing} onClose={() => setCarpetaModal(null)} />
      )}
      {puedeGestionar && confirmDelete && (
        <ConfirmDeleteModal
          message={`Se eliminará la carpeta "${confirmDelete.nombre}" y todos sus documentos permanentemente.`}
          onConfirm={() => deleteMut.mutate(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteMut.isPending}
        />
      )}
    </div>
  )
}

// ── View: Category List ───────────────────────────────────────────────────────

function CategoriasView({
  seccion, searchQ, onSearchChange, onSelectCategoria, onSearchNavigate,
}: {
  seccion: string
  searchQ: string
  onSearchChange: (q: string) => void
  onSelectCategoria: (c: CategoriaOficioResponse) => void
  onSearchNavigate: (cat: CategoriaOficioResponse, carpeta?: CarpetaOficioResponse) => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const puedeGestionar = user?.rol === 'ADMINISTRADOR' || user?.rol === 'OFICIAL'
  const [debounced, setDebounced] = useState('')
  const [catModal, setCatModal] = useState<{ existing?: CategoriaOficioResponse } | null>(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<CategoriaOficioResponse | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchQ), 400)
    return () => clearTimeout(t)
  }, [searchQ])

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['oficio-categorias', seccion],
    queryFn: () => oficioService.listarCategorias(seccion),
  })

  const deleteCatMut = useMutation({
    mutationFn: (id: number) => oficioService.eliminarCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oficio-categorias', seccion] })
      setConfirmDeleteCat(null)
    },
  })

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['oficio-admin-buscar', debounced, seccion],
    queryFn: () => oficioService.buscar(debounced, seccion),
    enabled: debounced.trim().length >= 2,
  })

  const showSearch = searchQ.trim().length >= 2
  const seccionInfo = SECCIONES.find((s) => s.key === seccion)!

  const handleResultClick = (r: OficioBusquedaResultado) => {
    const cat: CategoriaOficioResponse = {
      id: r.categoriaId, seccion, numero: r.categoriaNumero, nombre: r.categoriaNombre, totalCarpetas: 0,
    }
    if (r.tipo === 'CARPETA') {
      onSearchNavigate(cat)
    } else {
      const carpeta: CarpetaOficioResponse = {
        id: r.carpetaId, categoriaId: r.categoriaId, categoriaNombre: r.categoriaNombre,
        nombre: r.carpetaNombre, totalDocumentos: 0, createdAt: '',
      }
      onSearchNavigate(cat, carpeta)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Información de Oficio</h1>
          <p className="text-sm text-gray-500 mt-1">{seccionInfo.desc}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isLoading && !showSearch && (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-5 shadow-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{categorias.filter((c) => c.totalCarpetas > 0).length}</p>
                <p className="text-xs text-gray-500">Con contenido</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{categorias.reduce((s, c) => s + c.totalCarpetas, 0)}</p>
                <p className="text-xs text-gray-500">Carpetas total</p>
              </div>
            </div>
          )}
          {puedeGestionar && (
            <Button onClick={() => setCatModal({})}><Plus size={14} /> Nueva categoría</Button>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4 relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQ}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar carpeta o documento…"
          className="w-full pl-8 pr-8 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white"
        />
        {searchQ && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Search results */}
      {showSearch ? (
        <div className="space-y-1.5">
          {searching && <p className="text-sm text-gray-400 py-2 px-1">Buscando…</p>}
          {!searching && searchResults.length === 0 && (
            <p className="text-sm text-gray-400 py-2 px-1">Sin resultados para "{searchQ}"</p>
          )}
          {searchResults.map((r, i) => (
            <button
              key={i}
              onClick={() => handleResultClick(r)}
              className="w-full flex items-start gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-sm text-left transition-all"
            >
              {r.tipo === 'CARPETA'
                ? <Folder size={16} className="text-primary shrink-0 mt-0.5" />
                : <FileText size={16} className="text-red-400 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {r.tipo === 'CARPETA' ? r.carpetaNombre : r.documentoTitulo}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {r.categoriaNumero}. {r.categoriaNombre}
                  {r.tipo === 'DOCUMENTO' && ` › ${r.carpetaNombre}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <button
                onClick={() => onSelectCategoria(cat)}
                className="flex items-center gap-3 px-4 py-4 text-left flex-1"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {cat.numero}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                    {cat.nombre}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cat.totalCarpetas} carpeta{cat.totalCarpetas !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors shrink-0" />
              </button>
              {puedeGestionar && (
                <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCatModal({ existing: cat }) }}
                    className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Editar categoría"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteCat(cat) }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar categoría"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {puedeGestionar && catModal !== null && (
        <CategoriaModal seccion={seccion} existing={catModal.existing} onClose={() => setCatModal(null)} />
      )}
      {puedeGestionar && confirmDeleteCat && (
        <ConfirmDeleteModal
          message={`Se eliminará la categoría "${confirmDeleteCat.nombre}". Solo se puede eliminar si no tiene carpetas.`}
          onConfirm={() => deleteCatMut.mutate(confirmDeleteCat.id)}
          onCancel={() => setConfirmDeleteCat(null)}
          loading={deleteCatMut.isPending}
        />
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ViewState =
  | { level: 'categorias' }
  | { level: 'carpetas'; categoria: CategoriaOficioResponse }
  | { level: 'documentos'; categoria: CategoriaOficioResponse; carpeta: CarpetaOficioResponse }

export default function InformacionOficioPage() {
  const [activeSeccion, setActiveSeccion] = useState<SeccionKey>('LAIP')
  const [view, setView] = useState<ViewState>({ level: 'categorias' })
  const [searchQ, setSearchQ] = useState('')

  const handleTabChange = (s: SeccionKey) => {
    if (s === activeSeccion) return
    setActiveSeccion(s)
    setView({ level: 'categorias' })
    setSearchQ('')
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 -mt-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-gray-200 pb-0">
          {SECCIONES.map((s) => (
            <button
              key={s.key}
              onClick={() => handleTabChange(s.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                activeSeccion === s.key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view.level === 'categorias' && (
        <CategoriasView
          seccion={activeSeccion}
          searchQ={searchQ}
          onSearchChange={setSearchQ}
          onSelectCategoria={(cat) => { setSearchQ(''); setView({ level: 'carpetas', categoria: cat }) }}
          onSearchNavigate={(cat, carpeta) => {
            setSearchQ('')
            if (carpeta) setView({ level: 'documentos', categoria: cat, carpeta })
            else setView({ level: 'carpetas', categoria: cat })
          }}
        />
      )}

      {view.level === 'carpetas' && (
        <CarpetasView
          categoria={view.categoria}
          seccion={activeSeccion}
          onBack={() => setView({ level: 'categorias' })}
          onSelectCarpeta={(c) => setView({ level: 'documentos', categoria: view.categoria, carpeta: c })}
        />
      )}

      {view.level === 'documentos' && (
        <DocumentosView
          carpeta={view.carpeta}
          onBack={() => setView({ level: 'carpetas', categoria: view.categoria })}
        />
      )}
    </div>
  )
}
