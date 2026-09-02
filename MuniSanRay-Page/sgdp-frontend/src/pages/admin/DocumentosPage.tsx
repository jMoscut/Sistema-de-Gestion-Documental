import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import {
  Download,
  Eye,
  Upload,
  FileText,
  X,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Archive,
  RotateCcw,
  History,
  FilePlus,
  Tags,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react'

import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Alert from '../../components/common/Alert'
import { documentosService } from '../../services/documentos.service'
import { useAuth } from '../../context/AuthContext'
import type { CategoriaDocumento, DocumentoResponse, SubirDocumentoForm, VersionDocumentoResponse } from '../../types/documentos.types'

// ── helpers ────────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const NIVEL_ACCESO_BADGE: Record<string, string> = {
  PUBLICO: 'bg-green-100 text-green-800',
  INTERNO: 'bg-blue-100 text-blue-800',
}

const ESTADO_BADGE: Record<string, string> = {
  VIGENTE:   'bg-green-100 text-green-800',
  OBSOLETO:  'bg-gray-100 text-gray-600',
  BORRADOR:  'bg-yellow-100 text-yellow-800',
  ARCHIVADO: 'bg-red-100 text-red-700',
}

// ── Zod schema ─────────────────────────────────────────────────────────────────

const subirSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(500, 'Máximo 500 caracteres'),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  categoriaId: z
    .number({ invalid_type_error: 'Seleccione una categoría' })
    .int()
    .positive('Seleccione una categoría'),
  unidadOrigen: z.string().min(1, 'Requerido').max(150, 'Máximo 150 caracteres'),
  fechaEmision: z.string().min(1, 'Requerido'),
  nivelAcceso: z.enum(['PUBLICO', 'INTERNO']),
})

type SubirFormValues = z.infer<typeof subirSchema>

// ── Detail Modal ───────────────────────────────────────────────────────────────

function VersionesModal({ docId, onClose }: { docId: number; onClose: () => void }) {
  const { data: versiones, isLoading } = useQuery({
    queryKey: ['versiones', docId],
    queryFn: () => documentosService.listarVersiones(docId),
  })

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <History size={18} /> Historial de versiones
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          {isLoading && <p className="text-sm text-gray-500 text-center py-4">Cargando…</p>}
          {!isLoading && (!versiones || versiones.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-4">Sin versiones anteriores registradas.</p>
          )}
          {versiones?.map((v: VersionDocumentoResponse) => (
            <div key={v.id} className="rounded-lg border border-gray-200 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">v{v.numeroVersion}</span>
                <span className="text-gray-500">
                  {format(parseISO(v.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              {v.motivoCambio && <p className="text-gray-600">Motivo: {v.motivoCambio}</p>}
              {v.creadoPorNombre && <p className="text-gray-500">Por: {v.creadoPorNombre}</p>}
              <p className="text-gray-400 break-all">SHA-256: {v.hashSha256}</p>
              <p className="text-gray-400">Tamaño: {formatBytes(v.tamanoBytes)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  )
}

function NuevaVersionModal({
  doc,
  onClose,
  onSuccess,
}: {
  doc: DocumentoResponse
  onClose: () => void
  onSuccess: (updated: DocumentoResponse) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [motivoCambio, setMotivoCambio] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const MAX_BYTES = 25 * 1024 * 1024

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) return 'Tipo no permitido. Use PDF, DOC, DOCX, XLS o XLSX.'
    if (f.size > MAX_BYTES) return `El archivo supera 25 MB (${formatBytes(f.size)}).`
    return null
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setFileError(err); setFile(null) }
    else { setFileError(null); setFile(f) }
  }

  const mutation = useMutation({
    mutationFn: () => documentosService.subirNuevaVersion(doc.id, file!, motivoCambio || undefined),
    onSuccess: (updated) => onSuccess(updated),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setFileError('Seleccione un archivo.'); return }
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FilePlus size={18} /> Nueva versión
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{doc.codigo} — actualmente v{doc.versionActual}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => document.getElementById('nv-file-input')?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging ? 'border-primary bg-primary/5'
              : file ? 'border-green-400 bg-green-50'
              : fileError ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-primary hover:bg-primary/5'
            }`}
          >
            <input
              id="nv-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <>
                <FileText size={32} className="text-green-500 mb-2" />
                <p className="text-sm font-medium text-gray-900 text-center">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null) }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
                >
                  Quitar
                </button>
              </>
            ) : (
              <>
                <Upload size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Arrastre o haga clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX, XLS, XLSX — máx. 25 MB</p>
              </>
            )}
          </div>
          {fileError && <p className="text-xs text-red-600">{fileError}</p>}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del cambio <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={motivoCambio}
              onChange={(e) => setMotivoCambio(e.target.value)}
              placeholder="Ej: Corrección de datos en sección 3, actualización de firmas…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-600">Error al subir la nueva versión. Intente nuevamente.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={mutation.isPending}>
              <Upload size={14} />
              Subir v{doc.versionActual + 1}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetalleModal({
  doc,
  onClose,
  onDownload,
  onArchivar,
  onReactivar,
  archivandoId,
  onNuevaVersionSuccess,
}: {
  doc: DocumentoResponse
  onClose: () => void
  onDownload: (doc: DocumentoResponse) => void
  onArchivar: (doc: DocumentoResponse) => void
  onReactivar: (doc: DocumentoResponse) => void
  archivandoId: number | null
  onNuevaVersionSuccess: (updated: DocumentoResponse) => void
}) {
  const [showVersiones, setShowVersiones] = useState(false)
  const [showNuevaVersion, setShowNuevaVersion] = useState(false)
  const { user } = useAuth()
  const puedeGestionar = user?.rol === 'ADMINISTRADOR' || user?.rol === 'OFICIAL'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 font-mono">{doc.codigo}</p>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">{doc.titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <div className="p-6 space-y-4">
          {doc.descripcion && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Descripción
              </p>
              <p className="text-sm text-gray-700">{doc.descripcion}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría" value={doc.categoria.nombre} />
            <Field label="Unidad de origen" value={doc.unidadOrigen} />
            <Field
              label="Fecha de emisión"
              value={format(parseISO(doc.fechaEmision), 'dd/MM/yyyy', { locale: es })}
            />
            <Field
              label="Registrado"
              value={format(parseISO(doc.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
            />
            <Field label="Por" value={doc.registradoPorNombre} />
            <Field label="Versión" value={`v${doc.versionActual}`} />
          </div>

          <div className="flex gap-3 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${NIVEL_ACCESO_BADGE[doc.nivelAcceso]}`}
            >
              {doc.nivelAcceso}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[doc.estado] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {doc.estado}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-medium">Archivo:</span> {doc.nombreArchivo}
            </p>
            <p>
              <span className="font-medium">Tamaño:</span> {formatBytes(doc.tamanoBytes)}
            </p>
            <p className="break-all">
              <span className="font-medium">SHA-256:</span> {doc.hashSha256}
            </p>
          </div>

          {doc.versionActual > 1 && (
            <button
              onClick={() => setShowVersiones(true)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <History size={13} />
              Ver historial de versiones ({doc.versionActual - 1} anterior{doc.versionActual - 1 !== 1 ? 'es' : ''})
            </button>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-wrap justify-between gap-3 px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {puedeGestionar && doc.estado === 'VIGENTE' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNuevaVersion(true)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <FilePlus size={14} />
                  Nueva versión
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchivar(doc)}
                  loading={archivandoId === doc.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Archive size={14} />
                  Archivar
                </Button>
              </>
            )}
            {puedeGestionar && doc.estado === 'ARCHIVADO' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReactivar(doc)}
                loading={archivandoId === doc.id}
                className="text-green-700 hover:text-green-800 hover:bg-green-50"
              >
                <RotateCcw size={14} />
                Reactivar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button onClick={() => onDownload(doc)} disabled={doc.estado === 'ARCHIVADO'}>
              <Download size={16} />
              Descargar
            </Button>
          </div>
        </div>
      </div>

      {showVersiones && (
        <VersionesModal docId={doc.id} onClose={() => setShowVersiones(false)} />
      )}
      {showNuevaVersion && (
        <NuevaVersionModal
          doc={doc}
          onClose={() => setShowNuevaVersion(false)}
          onSuccess={(updated) => {
            setShowNuevaVersion(false)
            onNuevaVersionSuccess(updated)
          }}
        />
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

// ── Categorias Modal ───────────────────────────────────────────────────────────

const catSchema = z.object({
  nombre: z.string().min(1, 'Obligatorio').max(150),
  descripcion: z.string().max(500).optional(),
})
type CatForm = z.infer<typeof catSchema>

function CategoriasDocumentoModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<{ id: number; nombre: string; descripcion?: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nombre: string } | null>(null)

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: documentosService.listarCategorias,
  })

  const saveMut = useMutation({
    mutationFn: (data: CatForm) =>
      editing
        ? documentosService.actualizarCategoria(editing.id, data)
        : documentosService.crearCategoria(data),
    onSuccess: (saved) => {
      qc.setQueryData<CategoriaDocumento[]>(['categorias'], (old = []) => {
        const exists = old.some((c) => c.id === saved.id)
        return exists ? old.map((c) => (c.id === saved.id ? saved : c)) : [...old, saved]
      })
      qc.invalidateQueries({ queryKey: ['categorias'] })
      setEditing(null)
      setCreating(false)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => documentosService.eliminarCategoria(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<CategoriaDocumento[]>(['categorias'], (old = []) => old.filter((c) => c.id !== id))
      qc.invalidateQueries({ queryKey: ['categorias'] })
      setConfirmDelete(null)
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CatForm>({
    resolver: zodResolver(catSchema),
  })

  const startEdit = (cat: { id: number; nombre: string; descripcion?: string }) => {
    setCreating(false)
    setEditing(cat)
    reset({ nombre: cat.nombre, descripcion: cat.descripcion ?? '' })
  }

  const startCreate = () => {
    setEditing(null)
    setCreating(true)
    reset({ nombre: '', descripcion: '' })
  }

  const cancelForm = () => { setEditing(null); setCreating(false) }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Tags size={18} /> Categorías de documentos
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {isLoading && <p className="text-sm text-gray-400 text-center py-4">Cargando…</p>}
          {!isLoading && categorias.map((cat) =>
            editing?.id === cat.id ? (
              <form key={cat.id} onSubmit={handleSubmit((v) => saveMut.mutate(v))}
                className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Editar categoría</p>
                <Input label="Nombre *" {...register('nombre')} error={errors.nombre} />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                  <textarea {...register('descripcion')} rows={2} placeholder="Descripción breve…"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
                </div>
                {saveMut.isError && (
                  <p className="text-xs text-red-600">
                    {(saveMut.error as { response?: { data?: { error?: string } } } | null)
                      ?.response?.data?.error ?? 'Error al guardar la categoría.'}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>Cancelar</Button>
                  <Button type="submit" size="sm" loading={saveMut.isPending}>Actualizar</Button>
                </div>
              </form>
            ) : (
              <div key={cat.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{cat.nombre}</p>
                  {cat.descripcion && <p className="text-xs text-gray-400 truncate">{cat.descripcion}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button onClick={() => startEdit(cat)}
                    className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDelete({ id: cat.id, nombre: cat.nombre })}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}

          {creating && (
            <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Nueva categoría</p>
              <Input label="Nombre *" {...register('nombre')} error={errors.nombre} placeholder="Ej. Actas Municipales" />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                <textarea {...register('descripcion')} rows={2} placeholder="Descripción breve…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
              {saveMut.isError && <p className="text-xs text-red-600">Error al guardar. Verifique que el nombre no esté en uso.</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>Cancelar</Button>
                <Button type="submit" size="sm" loading={saveMut.isPending}>Crear</Button>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <Button size="sm" onClick={startCreate} disabled={creating || !!editing}>
            <Plus size={14} /> Nueva categoría
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">¿Eliminar categoría?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Se eliminará "{confirmDelete.nombre}". No se puede eliminar si tiene documentos asociados.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteMut.mutate(confirmDelete.id)}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// ── Lista Tab ──────────────────────────────────────────────────────────────────

function ListaTab() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [nivelAcceso, setNivelAcceso] = useState('')
  const [estado, setEstado] = useState('')
  const [searchParams, setSearchParams] = useState<{
    q?: string
    nivelAcceso?: string
    estado?: string
    page: number
    size: number
  }>({ page: 0, size: 20 })

  const [selectedDoc, setSelectedDoc] = useState<DocumentoResponse | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [cicloVidaId, setCicloVidaId] = useState<number | null>(null)

  const archivarMutation = useMutation({
    mutationFn: (id: number) => documentosService.archivar(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
      setSelectedDoc(updated)
      setCicloVidaId(null)
    },
    onSettled: () => setCicloVidaId(null),
  })

  const reactivarMutation = useMutation({
    mutationFn: (id: number) => documentosService.reactivar(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
      setSelectedDoc(updated)
      setCicloVidaId(null)
    },
    onSettled: () => setCicloVidaId(null),
  })

  const handleArchivar = (doc: DocumentoResponse) => {
    setCicloVidaId(doc.id)
    archivarMutation.mutate(doc.id)
  }

  const handleReactivar = (doc: DocumentoResponse) => {
    setCicloVidaId(doc.id)
    reactivarMutation.mutate(doc.id)
  }

  const handleNuevaVersionSuccess = (updated: DocumentoResponse) => {
    queryClient.invalidateQueries({ queryKey: ['documentos'] })
    queryClient.invalidateQueries({ queryKey: ['versiones', updated.id] })
    setSelectedDoc(updated)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['documentos', searchParams],
    queryFn: () => documentosService.buscar(searchParams),
  })

  const handleBuscar = () => {
    const params: typeof searchParams = { page: 0, size: 20 }
    if (q.trim()) params.q = q.trim()
    if (nivelAcceso) params.nivelAcceso = nivelAcceso
    if (estado) params.estado = estado
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => ({ ...prev, page: newPage }))
  }

  const handleDownload = useCallback(async (doc: DocumentoResponse) => {
    setDownloadingId(doc.id)
    try {
      await documentosService.descargar(doc.id, doc.nombreArchivo)
    } catch {
      // silently fail — user will notice nothing downloaded
    } finally {
      setDownloadingId(null)
    }
  }, [])

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0

  return (
    <div className="space-y-4">
      {/* Search controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Título, código, descripción…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de acceso
            </label>
            <select
              value={nivelAcceso}
              onChange={(e) => setNivelAcceso(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos</option>
              <option value="PUBLICO">Público</option>
              <option value="INTERNO">Interno</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="OBSOLETO">Obsoleto</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ARCHIVADO">Archivado</option>
            </select>
          </div>

          <Button onClick={handleBuscar}>
            <Search size={16} />
            Buscar
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Código',
                  'Título',
                  'Categoría',
                  'Nivel acceso',
                  'Fecha emisión',
                  'Tamaño',
                  'Estado',
                  'Acciones',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                    Error al cargar los documentos. Intente nuevamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.content.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No se encontraron documentos</p>
                    <p className="text-xs mt-1">Ajuste los filtros o suba un nuevo documento.</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                data?.content.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {doc.codigo}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-900 truncate" title={doc.titulo}>
                        {doc.titulo}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {doc.categoria.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${NIVEL_ACCESO_BADGE[doc.nivelAcceso]}`}
                      >
                        {doc.nivelAcceso}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {format(parseISO(doc.fechaEmision), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatBytes(doc.tamanoBytes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[doc.estado]}`}
                      >
                        {doc.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          title="Ver detalles"
                          onClick={() => setSelectedDoc(doc)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="Descargar"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors disabled:opacity-40"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Página {currentPage + 1} de {totalPages} — {data.totalElements} documentos
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedDoc && (
        <DetalleModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDownload={handleDownload}
          onArchivar={handleArchivar}
          onReactivar={handleReactivar}
          archivandoId={cicloVidaId}
          onNuevaVersionSuccess={handleNuevaVersionSuccess}
        />
      )}
    </div>
  )
}

// ── Subir Tab ──────────────────────────────────────────────────────────────────

function SubirTab({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedDoc, setUploadedDoc] = useState<DocumentoResponse | null>(null)
  const [showCategorias, setShowCategorias] = useState(false)

  const { data: categorias, isLoading: loadingCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: documentosService.listarCategorias,
    staleTime: 0,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubirFormValues>({
    resolver: zodResolver(subirSchema),
    defaultValues: {
      nivelAcceso: 'PUBLICO',
    },
  })

  const mutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: SubirDocumentoForm }) =>
      documentosService.subirDocumento(file, metadata),
    onSuccess: (doc) => {
      setUploadedDoc(doc)
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
    },
  })

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const MAX_BYTES = 25 * 1024 * 1024

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, XLS o XLSX.'
    }
    if (f.size > MAX_BYTES) {
      return `El archivo supera el límite de 25 MB (${formatBytes(f.size)}).`
    }
    return null
  }

  const handleFileChange = (f: File) => {
    const err = validateFile(f)
    if (err) {
      setFileError(err)
      setFile(null)
    } else {
      setFileError(null)
      setFile(f)
    }
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileChange(dropped)
  }

  const onSubmit = (values: SubirFormValues) => {
    if (!file) {
      setFileError('Debe seleccionar un archivo.')
      return
    }
    const metadata: SubirDocumentoForm = {
      titulo: values.titulo,
      descripcion: values.descripcion || undefined,
      categoriaId: Number(values.categoriaId),
      unidadOrigen: values.unidadOrigen,
      fechaEmision: values.fechaEmision,
      nivelAcceso: values.nivelAcceso,
    }
    mutation.mutate({ file, metadata })
  }

  const handleSubirOtro = () => {
    setUploadedDoc(null)
    setFile(null)
    setFileError(null)
    mutation.reset()
    reset()
  }

  // Success state
  if (uploadedDoc) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Documento registrado</h3>
          <p className="text-sm text-gray-500 mb-2">
            El archivo fue subido y registrado exitosamente.
          </p>
          <p className="inline-block font-mono text-sm bg-gray-100 px-3 py-1 rounded-md text-primary font-semibold mb-6">
            {uploadedDoc.codigo}
          </p>
          <p className="text-sm font-medium text-gray-700 mb-6">{uploadedDoc.titulo}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={handleSubirOtro}>
              Subir otro
            </Button>
            <Button onClick={onSuccess}>
              <FileText size={16} />
              Ver en lista
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          Información del documento
        </h3>

        {/* Título */}
        <Input
          label="Título *"
          placeholder="Ingrese el título del documento"
          error={errors.titulo}
          {...register('titulo')}
        />

        {/* Descripción */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            rows={3}
            placeholder="Descripción opcional del contenido del documento"
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
              errors.descripcion ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('descripcion')}
          />
          {errors.descripcion && (
            <p className="text-xs text-red-600">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Categoría *</label>
          <select
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.categoriaId ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('categoriaId', { valueAsNumber: true })}
            defaultValue=""
          >
            <option value="" disabled>
              {loadingCategorias ? 'Cargando…' : 'Seleccione una categoría'}
            </option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.categoriaId && (
            <p className="text-xs text-red-600">{errors.categoriaId.message}</p>
          )}
        </div>

        {/* Unidad de origen */}
        <Input
          label="Unidad de origen *"
          placeholder="Ej: Dirección Municipal de Planificación"
          error={errors.unidadOrigen}
          {...register('unidadOrigen')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha de emisión */}
          <Input
            label="Fecha de emisión *"
            type="date"
            error={errors.fechaEmision}
            {...register('fechaEmision')}
          />

          {/* Nivel de acceso */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Nivel de acceso *</label>
            <select
              className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.nivelAcceso ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('nivelAcceso')}
            >
              <option value="PUBLICO">Público</option>
              <option value="INTERNO">Interno</option>
            </select>
            {errors.nivelAcceso && (
              <p className="text-xs text-red-600">{errors.nivelAcceso.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* File upload */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Archivo
        </h3>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary-50'
              : file
              ? 'border-green-400 bg-green-50'
              : fileError
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 hover:border-primary hover:bg-primary-50'
          }`}
        >
          <input
            id="file-input"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileChange(f)
            }}
          />

          {file ? (
            <>
              <FileText size={36} className="text-green-500 mb-3" />
              <p className="font-medium text-gray-900 text-sm text-center">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setFileError(null)
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
              >
                Quitar archivo
              </button>
            </>
          ) : (
            <>
              <Upload size={36} className="text-gray-300 mb-3" />
              <p className="font-medium text-gray-600 text-sm">
                Arrastre el archivo aquí o haga clic para seleccionar
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOC, DOCX, XLS, XLSX — máx. 25 MB
              </p>
            </>
          )}
        </div>

        {fileError && <p className="text-xs text-red-600 mt-2">{fileError}</p>}
      </div>

      {/* Submit error */}
      {mutation.isError && (
        <Alert type="error">
          {(mutation.error as { response?: { data?: { error?: string; detalle?: string } } })
            ?.response?.data?.detalle ??
            (mutation.error as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ??
            'Error al subir el documento. Verifique los datos e intente nuevamente.'}
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <Button type="button" variant="ghost" onClick={() => setShowCategorias(true)}>
          <Tags size={16} />
          Gestionar categorías
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          <Upload size={16} />
          Subir documento
        </Button>
      </div>

      {showCategorias && (
        <CategoriasDocumentoModal onClose={() => {
          setShowCategorias(false)
          queryClient.invalidateQueries({ queryKey: ['categorias'] })
          queryClient.refetchQueries({ queryKey: ['categorias'] })
        }} />
      )}
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DocumentosPage() {
  const { user } = useAuth()
  const puedeSubir = user?.rol === 'ADMINISTRADOR' || user?.rol === 'OFICIAL'
  const [activeTab, setActiveTab] = useState<'lista' | 'subir'>('lista')

  const handleUploadSuccess = () => {
    setActiveTab('lista')
  }

  const tabs: { key: 'lista' | 'subir'; label: string }[] = [
    { key: 'lista', label: 'Lista de documentos' },
    ...(puedeSubir ? [{ key: 'subir' as const, label: 'Subir documento' }] : []),
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registro y búsqueda de documentos institucionales.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg -mb-px border-b-2 ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'lista' && <ListaTab />}
      {activeTab === 'subir' && puedeSubir && <SubirTab onSuccess={handleUploadSuccess} />}
    </div>
  )
}
