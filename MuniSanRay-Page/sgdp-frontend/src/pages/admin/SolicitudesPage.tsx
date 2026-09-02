import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale/es'
import {
  Eye,
  UserPlus,
  Clock,
  MessageSquare,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  FileText,
  Search,
  Paperclip,
} from 'lucide-react'

import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'
import { solicitudesService } from '../../services/solicitudes.service'
import { useAuth } from '../../context/AuthContext'
import type {
  SolicitudAdminResponse,
  EstadoSolicitud,
  OficialResponse,
  DocumentoPublico,
} from '../../types/solicitudes.types'

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return format(parseISO(iso), 'dd/MM/yyyy', { locale: es })
}

function fmtDateTime(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ── Estado badges ─────────────────────────────────────────────────────────────

const ESTADO_BADGE_CLASS: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  PRORROGADA: 'bg-orange-100 text-orange-800',
  RESPONDIDA: 'bg-green-100 text-green-800',
  DENEGADA: 'bg-red-100 text-red-800',
  VENCIDA: 'bg-gray-100 text-gray-600',
}

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  PRORROGADA: 'Prorrogada',
  RESPONDIDA: 'Respondida',
  DENEGADA: 'Denegada',
  VENCIDA: 'Vencida',
}

function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE_CLASS[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  )
}

// ── Días restantes cell ───────────────────────────────────────────────────────

function DiasRestantesCell({ dias }: { dias: number }) {
  if (dias <= 0)
    return <span className="text-xs font-semibold text-red-600">VENCIDA</span>
  if (dias <= 3)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
        <AlertTriangle size={13} />
        {dias}d
      </span>
    )
  return <span className="text-xs font-semibold text-green-600">{dias}d</span>
}

// ── Shared modal shell ────────────────────────────────────────────────────────

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

// ── DetailModal ───────────────────────────────────────────────────────────────

type ModalType = 'detail' | 'asignar' | 'prorrogar' | 'responder' | 'denegar'

function DetailModal({
  solicitud,
  onClose,
  onAction,
  puedeActuar,
}: {
  solicitud: SolicitudAdminResponse
  onClose: () => void
  onAction: (type: Exclude<ModalType, 'detail'>, s: SolicitudAdminResponse) => void
  puedeActuar: boolean
}) {
  const isActive = !['RESPONDIDA', 'DENEGADA'].includes(solicitud.estado)
  const estadoAccionable = ['PENDIENTE', 'EN_PROCESO', 'VENCIDA'].includes(solicitud.estado)
  const canAsignar = estadoAccionable && !solicitud.oficialAsignadoId
  const canProrrogar = estadoAccionable && puedeActuar
  const canResponder = isActive && puedeActuar
  const canDenegar = estadoAccionable && puedeActuar

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-gray-500">{solicitud.codigoExpediente}</span>
            <EstadoBadge estado={solicitud.estado} />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <div className="p-6 space-y-5">
          {/* Solicitante info grid */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Solicitante" value={solicitud.nombreSolicitante} />
            <Field label="DPI" value={solicitud.dpiSolicitante} />
            <Field label="Correo" value={solicitud.correoSolicitante} />
            <Field label="Teléfono" value={solicitud.telefonoSolicitante} />
            <Field label="Oficial asignado" value={solicitud.oficialAsignadoNombre} />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Días restantes
              </p>
              <DiasRestantesCell dias={solicitud.diasRestantes} />
            </div>
            <Field label="Fecha recepción" value={fmtDate(solicitud.fechaRecepcion)} />
            <Field label="Fecha límite" value={fmtDate(solicitud.fechaLimite)} />
          </div>

          {/* Descripción */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Descripción de la solicitud
            </p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {solicitud.descripcionSolicitud}
            </p>
          </div>

          {/* Prórroga */}
          {solicitud.motivoProrroga && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
                Prórroga
              </p>
              <Field label="Motivo" value={solicitud.motivoProrroga} />
              {solicitud.fechaProrroga && (
                <Field label="Nueva fecha límite" value={fmtDate(solicitud.fechaProrroga)} />
              )}
            </div>
          )}

          {/* Respuesta */}
          {solicitud.respuesta && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                Respuesta
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{solicitud.respuesta}</p>
              {solicitud.fechaRespuesta && (
                <Field label="Fecha de respuesta" value={fmtDateTime(solicitud.fechaRespuesta)} />
              )}
              {solicitud.documentoRespuestaCodigo && (
                <Field
                  label="Documento adjunto"
                  value={solicitud.documentoRespuestaCodigo}
                />
              )}
            </div>
          )}

          {/* Denegación */}
          {solicitud.causalDenegacion && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                Causal de denegación
              </p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {solicitud.causalDenegacion}
              </p>
            </div>
          )}
        </div>

        {/* footer with action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-6">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex flex-wrap gap-2">
            {canAsignar && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction('asignar', solicitud)}
                title="Asignar oficial"
              >
                <UserPlus size={15} />
                Asignar
              </Button>
            )}
            {canProrrogar && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onAction('prorrogar', solicitud)}
                title="Prorrogar"
              >
                <Clock size={15} />
                Prorrogar
              </Button>
            )}
            {canResponder && (
              <Button
                size="sm"
                onClick={() => onAction('responder', solicitud)}
                title="Responder"
              >
                <MessageSquare size={15} />
                Responder
              </Button>
            )}
            {canDenegar && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => onAction('denegar', solicitud)}
                title="Denegar"
              >
                <XCircle size={15} />
                Denegar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AsignarModal ──────────────────────────────────────────────────────────────

const asignarSchema = z.object({
  oficialId: z
    .number({ invalid_type_error: 'Seleccione un oficial' })
    .int()
    .positive('Seleccione un oficial'),
})
type AsignarValues = z.infer<typeof asignarSchema>

function AsignarModal({
  solicitud,
  onClose,
  soloAutoAsignar,
  propioId,
}: {
  solicitud: SolicitudAdminResponse
  onClose: () => void
  soloAutoAsignar: boolean
  propioId?: number
}) {
  const queryClient = useQueryClient()

  const { data: oficialesRaw, isLoading: loadingOficiales } = useQuery<OficialResponse[]>({
    queryKey: ['oficiales'],
    queryFn: solicitudesService.listarOficiales,
  })

  const oficiales = soloAutoAsignar
    ? oficialesRaw?.filter((o) => o.id === propioId)
    : oficialesRaw

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AsignarValues>({
    resolver: zodResolver(asignarSchema),
    defaultValues: soloAutoAsignar && propioId ? { oficialId: propioId } : undefined,
  })

  const mutation = useMutation({
    mutationFn: (values: AsignarValues) =>
      solicitudesService.asignar(solicitud.id, { oficialId: values.oficialId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      onClose()
    },
  })

  const onSubmit = (values: AsignarValues) => mutation.mutate(values)

  return (
    <ModalShell
      title="Asignar oficial"
      subtitle={solicitud.codigoExpediente}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Oficial *</label>
          <select
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.oficialId ? 'border-red-500' : 'border-gray-300'
            }`}
            defaultValue={soloAutoAsignar && propioId ? propioId : ''}
            disabled={soloAutoAsignar}
            {...register('oficialId', { valueAsNumber: true })}
          >
            <option value="" disabled>
              {loadingOficiales ? 'Cargando…' : 'Seleccione un oficial'}
            </option>
            {oficiales?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombreCompleto}
                {o.unidadMunicipal ? ` — ${o.unidadMunicipal}` : ''}
              </option>
            ))}
          </select>
          {errors.oficialId && (
            <p className="text-xs text-red-600">{errors.oficialId.message}</p>
          )}
        </div>

        {mutation.isError && (
          <Alert type="error">Error al asignar el oficial. Intente nuevamente.</Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <UserPlus size={15} />
            Asignar
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── ProrrogarModal ────────────────────────────────────────────────────────────

const prorrogarSchema = z.object({
  motivoProrroga: z.string().min(10, 'Mínimo 10 caracteres').max(1000, 'Máximo 1000 caracteres'),
})
type ProrrogarValues = z.infer<typeof prorrogarSchema>

function ProrrogarModal({
  solicitud,
  onClose,
}: {
  solicitud: SolicitudAdminResponse
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProrrogarValues>({
    resolver: zodResolver(prorrogarSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: ProrrogarValues) =>
      solicitudesService.prorrogar(solicitud.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      onClose()
    },
  })

  const onSubmit = (values: ProrrogarValues) => mutation.mutate(values)

  return (
    <ModalShell
      title="Prorrogar solicitud"
      subtitle={solicitud.codigoExpediente}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Motivo de prórroga *
          </label>
          <textarea
            rows={4}
            placeholder="Explique el motivo por el cual se requiere prórroga (mínimo 10 caracteres)"
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
              errors.motivoProrroga ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('motivoProrroga')}
          />
          {errors.motivoProrroga && (
            <p className="text-xs text-red-600">{errors.motivoProrroga.message}</p>
          )}
        </div>

        {mutation.isError && (
          <Alert type="error">Error al registrar la prórroga. Intente nuevamente.</Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <Clock size={15} />
            Prorrogar
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── ResponderModal ────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const responderSchema = z.object({
  respuesta: z.string().min(20, 'Mínimo 20 caracteres').max(5000, 'Máximo 5000 caracteres'),
})
type ResponderValues = z.infer<typeof responderSchema>

function ResponderModal({
  solicitud,
  onClose,
}: {
  solicitud: SolicitudAdminResponse
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [searchQ, setSearchQ] = useState('')
  const [adjuntos, setAdjuntos] = useState<DocumentoPublico[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: todosPublicos, isFetching: buscando } = useQuery({
    queryKey: ['docsPublicos'],
    queryFn: () => solicitudesService.listarTodosDocumentosPublicos(),
    enabled: showResults,
    staleTime: 60_000,
  })

  const resultadosContent = todosPublicos
    ? searchQ.length >= 2
      ? todosPublicos.filter((d) =>
          d.titulo.toLowerCase().includes(searchQ.toLowerCase()) ||
          d.codigo.toLowerCase().includes(searchQ.toLowerCase()),
        )
      : todosPublicos
    : []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResponderValues>({
    resolver: zodResolver(responderSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: ResponderValues) =>
      solicitudesService.responder(solicitud.id, {
        respuesta: values.respuesta,
        documentoAdjuntoIds: adjuntos.filter((d) => d.origen === 'DOCUMENTO').map((d) => d.id),
        documentoOficioAdjuntoIds: adjuntos.filter((d) => d.origen === 'OFICIO').map((d) => d.id),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      onClose()
    },
  })

  const agregarDoc = (doc: DocumentoPublico) => {
    if (!adjuntos.find((d) => d.id === doc.id && d.origen === doc.origen)) {
      setAdjuntos((prev) => [...prev, doc])
    }
    setSearchQ('')
    setShowResults(false)
  }

  const quitarDoc = (id: number, origen: DocumentoPublico['origen']) =>
    setAdjuntos((prev) => prev.filter((d) => !(d.id === id && d.origen === origen)))

  const onSubmit = (values: ResponderValues) => mutation.mutate(values)

  const docsDisponibles = resultadosContent.filter(
    (d) => !adjuntos.find((a) => a.id === d.id && a.origen === d.origen),
  )

  return (
    <ModalShell
      title="Responder solicitud"
      subtitle={solicitud.codigoExpediente}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {/* Respuesta text */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Respuesta *</label>
          <textarea
            rows={5}
            placeholder="Ingrese la respuesta a la solicitud de información (mínimo 20 caracteres)"
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
              errors.respuesta ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('respuesta')}
          />
          {errors.respuesta && (
            <p className="text-xs text-red-600">{errors.respuesta.message}</p>
          )}
        </div>

        {/* Document picker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Paperclip size={14} className="inline mr-1" />
            Documentos adjuntos{' '}
            <span className="font-normal text-gray-400">(opcional — solo documentos públicos)</span>
          </label>

          {/* Selected chips */}
          {adjuntos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {adjuntos.map((doc) => (
                <span
                  key={`${doc.origen}-${doc.id}`}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full max-w-[260px]"
                >
                  <FileText size={12} className="shrink-0" />
                  <span className="truncate" title={doc.titulo}>{doc.titulo}</span>
                  <span className="text-gray-400 shrink-0">· {formatBytes(doc.tamanoBytes)}</span>
                  <button
                    type="button"
                    onClick={() => quitarDoc(doc.id, doc.origen)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input + dropdown */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value)
                  setShowResults(true)
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="Buscar documento público por título…"
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {buscando && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  Buscando…
                </span>
              )}
            </div>

            {showResults && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {docsDisponibles.length === 0 && !buscando ? (
                  <p className="px-3 py-2 text-xs text-gray-500">
                    {searchQ.length === 0
                      ? 'No hay documentos públicos disponibles'
                      : 'Sin resultados para esta búsqueda'}
                  </p>
                ) : (
                  docsDisponibles.map((doc) => (
                    <button
                      key={`${doc.origen}-${doc.id}`}
                      type="button"
                      onMouseDown={() => agregarDoc(doc)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.titulo}</p>
                      <p className="text-xs text-gray-400">
                        {doc.codigo} · {formatBytes(doc.tamanoBytes)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Los documentos adjuntos se enviarán como archivos PDF al correo del solicitante.
          </p>
        </div>

        {mutation.isError && (
          <Alert type="error">
            {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data
              ?.error ?? 'Error al registrar la respuesta. Intente nuevamente.'}
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <MessageSquare size={15} />
            Responder
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── DenegarModal ──────────────────────────────────────────────────────────────

const denegarSchema = z.object({
  causalDenegacion: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
})
type DenegarValues = z.infer<typeof denegarSchema>

function DenegarModal({
  solicitud,
  onClose,
}: {
  solicitud: SolicitudAdminResponse
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DenegarValues>({
    resolver: zodResolver(denegarSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: DenegarValues) =>
      solicitudesService.denegar(solicitud.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] })
      onClose()
    },
  })

  const onSubmit = (values: DenegarValues) => mutation.mutate(values)

  return (
    <ModalShell
      title="Denegar solicitud"
      subtitle={solicitud.codigoExpediente}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <Alert type="error">
          Esta acción es irreversible. La solicitud quedará marcada como DENEGADA.
        </Alert>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Causal de denegación *
          </label>
          <textarea
            rows={4}
            placeholder="Indique el fundamento legal o motivo de la denegación (mínimo 10 caracteres)"
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
              errors.causalDenegacion ? 'border-red-500' : 'border-gray-300'
            }`}
            {...register('causalDenegacion')}
          />
          {errors.causalDenegacion && (
            <p className="text-xs text-red-600">{errors.causalDenegacion.message}</p>
          )}
        </div>

        {mutation.isError && (
          <Alert type="error">Error al denegar la solicitud. Intente nuevamente.</Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger" loading={mutation.isPending}>
            <XCircle size={15} />
            Denegar
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

// ── Status filter tabs ────────────────────────────────────────────────────────

const TABS: { key: EstadoSolicitud | ''; label: string }[] = [
  { key: '', label: 'Todas' },
  { key: 'PENDIENTE', label: 'Pendiente' },
  { key: 'EN_PROCESO', label: 'En proceso' },
  { key: 'PRORROGADA', label: 'Prorrogada' },
  { key: 'RESPONDIDA', label: 'Respondida' },
  { key: 'DENEGADA', label: 'Denegada' },
  { key: 'VENCIDA', label: 'Vencida' },
]

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SolicitudesPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'ADMINISTRADOR'
  const isOficial = user?.rol === 'OFICIAL'

  const [estadoFilter, setEstadoFilter] = useState<EstadoSolicitud | ''>('')
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [searchQ, setSearchQ] = useState('')

  // Modal state
  const [detailSolicitud, setDetailSolicitud] = useState<SolicitudAdminResponse | null>(null)
  const [actionModal, setActionModal] = useState<{
    type: Exclude<ModalType, 'detail'>
    solicitud: SolicitudAdminResponse
  } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['solicitudes', { estado: estadoFilter, q: searchQ, page }],
    queryFn: () =>
      solicitudesService.listar({
        estado: estadoFilter || undefined,
        q: searchQ || undefined,
        page,
        size: 20,
      }),
  })

  const handleTabChange = (key: EstadoSolicitud | '') => {
    setEstadoFilter(key)
    setPage(0)
  }

  const handleBuscar = () => {
    setSearchQ(q.trim())
    setPage(0)
  }

  const handleLimpiarBusqueda = () => {
    setQ('')
    setSearchQ('')
    setPage(0)
  }

  const handleAction = (
    type: Exclude<ModalType, 'detail'>,
    solicitud: SolicitudAdminResponse,
  ) => {
    setDetailSolicitud(null)
    setActionModal({ type, solicitud })
  }

  const closeActionModal = () => setActionModal(null)

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const totalElements = data?.totalElements ?? 0

  // Per-row action visibility
  // Admin: solo ve y asigna. Oficial: solo puede actuar (prorrogar/responder/denegar)
  // sobre solicitudes asignadas a sí mismo.
  const esOficialAsignado = (s: SolicitudAdminResponse) =>
    isOficial && s.oficialAsignadoId === user?.id
  const puedeActuar = (s: SolicitudAdminResponse) => !isAdmin && esOficialAsignado(s)

  const canAsignar = (s: SolicitudAdminResponse) =>
    ['PENDIENTE', 'EN_PROCESO', 'VENCIDA'].includes(s.estado) && !s.oficialAsignadoId
  const canProrrogar = (s: SolicitudAdminResponse) =>
    ['PENDIENTE', 'EN_PROCESO', 'VENCIDA'].includes(s.estado) && puedeActuar(s)
  const puedeResponderEstado = (s: SolicitudAdminResponse) =>
    !['RESPONDIDA', 'DENEGADA'].includes(s.estado)
  const canResponder = (s: SolicitudAdminResponse) =>
    puedeResponderEstado(s) && !!s.oficialAsignadoId && puedeActuar(s)
  const canDenegar = (s: SolicitudAdminResponse) =>
    ['PENDIENTE', 'EN_PROCESO', 'VENCIDA'].includes(s.estado) && puedeActuar(s)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes LAIP</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de solicitudes de información pública (Decreto 57-2008)
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Código, solicitante, DPI, correo, descripción…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <Button onClick={handleBuscar}>
            <Search size={16} />
            Buscar
          </Button>
          {searchQ && (
            <Button variant="ghost" onClick={handleLimpiarBusqueda}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="overflow-x-auto -mx-1 px-1 mb-4">
        <div className="flex gap-1 border-b border-gray-200 min-w-max">
          {TABS.map((tab) => {
            const isActive = estadoFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg -mb-px border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {!isLoading && tab.key === estadoFilter && totalElements > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[1.25rem] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
                    {totalElements}
                  </span>
                )}
              </button>
            )
          })}
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
                  'Solicitante',
                  'Descripción',
                  'Estado',
                  'Días rest.',
                  'Fecha límite',
                  'Oficial asignado',
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
              {/* Skeleton loading */}
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

              {/* Error */}
              {isError && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-red-600">
                    Error al cargar las solicitudes. Intente nuevamente.
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isLoading && !isError && data?.content.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No hay solicitudes con este estado</p>
                    <p className="text-xs mt-1">
                      Cambie el filtro para ver otros registros.
                    </p>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading &&
                !isError &&
                data?.content.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {s.codigoExpediente}
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="font-medium text-gray-900 truncate" title={s.nombreSolicitante}>
                        {s.nombreSolicitante}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-gray-600 text-xs" title={s.descripcionSolicitud}>
                        {truncate(s.descripcionSolicitud, 60)}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EstadoBadge estado={s.estado} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DiasRestantesCell dias={s.diasRestantes} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {fmtDate(s.fechaLimite)}
                    </td>
                    <td className="px-4 py-3 max-w-[150px]">
                      {s.oficialAsignadoNombre ? (
                        <p
                          className="text-xs text-gray-600 truncate"
                          title={s.oficialAsignadoNombre}
                        >
                          {s.oficialAsignadoNombre}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {/* View detail */}
                        <button
                          title="Ver detalle"
                          onClick={() => setDetailSolicitud(s)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Asignar */}
                        {canAsignar(s) && (
                          <button
                            title="Asignar oficial"
                            onClick={() => handleAction('asignar', s)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                          >
                            <UserPlus size={15} />
                          </button>
                        )}

                        {/* Prorrogar */}
                        {canProrrogar(s) && (
                          <button
                            title="Prorrogar"
                            onClick={() => handleAction('prorrogar', s)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <Clock size={15} />
                          </button>
                        )}

                        {/* Responder */}
                        {puedeResponderEstado(s) && (
                          canResponder(s) ? (
                            <button
                              title="Responder"
                              onClick={() => handleAction('responder', s)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            >
                              <MessageSquare size={15} />
                            </button>
                          ) : (
                            <button
                              title={
                                isAdmin
                                  ? 'El administrador solo puede ver y asignar'
                                  : 'Debe estar asignado a esta solicitud para responder'
                              }
                              disabled
                              className="p-1.5 rounded-md text-gray-300 cursor-not-allowed"
                            >
                              <MessageSquare size={15} />
                            </button>
                          )
                        )}

                        {/* Denegar */}
                        {canDenegar(s) && (
                          <button
                            title="Denegar"
                            onClick={() => handleAction('denegar', s)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
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
              Página {currentPage + 1} de {totalPages} — {totalElements} solicitudes
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailSolicitud && (
        <DetailModal
          solicitud={detailSolicitud}
          onClose={() => setDetailSolicitud(null)}
          onAction={handleAction}
          puedeActuar={puedeActuar(detailSolicitud)}
        />
      )}

      {/* Action Modals */}
      {actionModal?.type === 'asignar' && (
        <AsignarModal
          solicitud={actionModal.solicitud}
          onClose={closeActionModal}
          soloAutoAsignar={isOficial}
          propioId={user?.id}
        />
      )}
      {actionModal?.type === 'prorrogar' && (
        <ProrrogarModal solicitud={actionModal.solicitud} onClose={closeActionModal} />
      )}
      {actionModal?.type === 'responder' && (
        <ResponderModal solicitud={actionModal.solicitud} onClose={closeActionModal} />
      )}
      {actionModal?.type === 'denegar' && (
        <DenegarModal solicitud={actionModal.solicitud} onClose={closeActionModal} />
      )}
    </div>
  )
}
