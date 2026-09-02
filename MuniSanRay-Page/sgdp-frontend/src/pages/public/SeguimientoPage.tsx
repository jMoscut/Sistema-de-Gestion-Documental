import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { format, differenceInDays, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search, Clock, CheckCircle, AlertCircle, XCircle, RotateCcw } from 'lucide-react'
import { publicoService } from '../../services/publico.service'
import type { SeguimientoResponse } from '../../types/publico.types'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'
import Spinner from '../../components/common/Spinner'

type EstadoColor = {
  bg: string
  text: string
  border: string
  badge: string
  label: string
  icon: React.ReactNode
}

function getEstadoStyle(estado: SeguimientoResponse['estado']): EstadoColor {
  const iconClass = 'w-4 h-4'
  switch (estado) {
    case 'PENDIENTE':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        label: 'Pendiente',
        icon: <Clock className={iconClass} />,
      }
    case 'EN_PROCESO':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        label: 'En Proceso',
        icon: <RotateCcw className={iconClass} />,
      }
    case 'PRORROGADA':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-800',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800',
        label: 'Prorrogada',
        icon: <AlertCircle className={iconClass} />,
      }
    case 'RESPONDIDA':
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        label: 'Respondida',
        icon: <CheckCircle className={iconClass} />,
      }
    case 'DENEGADA':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        label: 'Denegada',
        icon: <XCircle className={iconClass} />,
      }
    case 'VENCIDA':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        label: 'Vencida',
        icon: <XCircle className={iconClass} />,
      }
  }
}

function privatizeName(nombre: string): string {
  const parts = nombre.trim().split(/\s+/)
  if (parts.length === 0) return nombre
  const first = parts[0]
  const rest = parts
    .slice(1)
    .map((p) => (p.length > 0 ? p[0] + '.' : ''))
    .join(' ')
  return rest ? `${first} ${rest}` : first
}

function ProgressBar({ fechaRecepcion, fechaLimite }: { fechaRecepcion: string; fechaLimite: string }) {
  const inicio = parseISO(fechaRecepcion)
  const fin = parseISO(fechaLimite)
  const hoy = new Date()
  const total = differenceInDays(fin, inicio)
  const usado = Math.min(differenceInDays(hoy, inicio), total)
  const porcentaje = total > 0 ? Math.max(0, Math.min(100, (usado / total) * 100)) : 0
  const isOverdue = hoy > fin

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Recibida: {format(inicio, 'dd/MM/yyyy', { locale: es })}</span>
        <span>Límite: {format(fin, 'dd/MM/yyyy', { locale: es })}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverdue ? 'bg-red-500' : porcentaje > 80 ? 'bg-orange-400' : 'bg-primary'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {isOverdue
          ? `Venció hace ${differenceInDays(hoy, fin)} días`
          : `${differenceInDays(fin, hoy)} días hábiles restantes`}
      </p>
    </div>
  )
}

function ResultCard({ data }: { data: SeguimientoResponse }) {
  const style = getEstadoStyle(data.estado)

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden`}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-current border-opacity-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Expediente
            </p>
            <p className="text-2xl font-bold text-gray-900">{data.codigoExpediente}</p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${style.badge}`}
          >
            {style.icon}
            {style.label}
          </span>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Solicitante */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Solicitante
          </p>
          <p className="text-sm text-gray-800 font-medium">{privatizeName(data.nombreSolicitante)}</p>
        </div>

        {/* Progress */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Progreso del trámite
          </p>
          <ProgressBar fechaRecepcion={data.fechaRecepcion} fechaLimite={data.fechaLimite} />
        </div>

        {/* Prórroga */}
        {data.estado === 'PRORROGADA' && data.fechaProrroga && (
          <div className="bg-orange-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-0.5">
              Solicitud Prorrogada
            </p>
            <p className="text-sm text-orange-800">
              Nueva fecha límite:{' '}
              <strong>
                {format(parseISO(data.fechaProrroga), 'dd/MM/yyyy', { locale: es })}
              </strong>
            </p>
          </div>
        )}

        {/* Respuesta */}
        {data.estado === 'RESPONDIDA' && data.fechaRespuesta && (
          <div className="bg-green-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            </p>
            <p className="text-xs text-green-600">
              Fecha de respuesta:{' '}
              {format(parseISO(data.fechaRespuesta), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        )}

        {/* Denegación */}
        {data.estado === 'DENEGADA' && data.fechaRespuesta && (
          <div className="bg-red-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
              Solicitud Denegada
            </p>
            <p className="text-xs text-red-600">
              Fecha: {format(parseISO(data.fechaRespuesta), 'dd/MM/yyyy', { locale: es })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SeguimientoPage() {
  const [codigo, setCodigo] = useState('')
  const [submittedCodigo, setSubmittedCodigo] = useState('')

  const mutation = useMutation({
    mutationFn: publicoService.consultarSeguimiento,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let trimmed = codigo.trim().toUpperCase()
    if (!trimmed) return
    // Normalize: "2026-0001" → "SOL-2026-0001"
    if (/^\d{4}-\d{4,}$/.test(trimmed)) {
      trimmed = `SOL-${trimmed}`
      setCodigo(trimmed)
    }
    setSubmittedCodigo(trimmed)
    mutation.mutate(trimmed)
  }

  const handleNewSearch = () => {
    setCodigo('')
    setSubmittedCodigo('')
    mutation.reset()
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-primary text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-6 h-6 text-accent" />
            <span className="text-accent text-sm font-semibold uppercase tracking-wide">
              LAIP · Art. 26
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Seguimiento de Solicitud</h1>
          <p className="text-primary-200 text-base">
            Ingrese el código de expediente que recibió al presentar su solicitud para consultar
            el estado actual de su trámite.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Search form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="codigo-expediente" className="sr-only">
                Código de expediente
              </label>
              <input
                id="codigo-expediente"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="SOL-2026-0001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono
                  shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary uppercase"
              />
            </div>
            <Button type="submit" loading={mutation.isPending} disabled={!codigo.trim()}>
              <Search className="w-4 h-4" />
              Consultar
            </Button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            Ejemplo: SOL-2026-0001. El código fue enviado a su correo y se mostró al completar su
            solicitud.
          </p>
        </div>

        {/* Loading */}
        {mutation.isPending && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {mutation.isError && (
          <div className="space-y-4">
            <Alert type="error">
              {(() => {
                const err = mutation.error as { response?: { status?: number } } | null
                if (err?.response?.status === 404) {
                  return <>No se encontró el expediente <strong>{submittedCodigo}</strong>. Verifique que el código sea correcto e intente de nuevo.</>
                }
                if (!err?.response) {
                  return <>Error de conexión al servidor. Verifique su conexión e intente de nuevo.</>
                }
                return <>Error al consultar el expediente <strong>{submittedCodigo}</strong>. Por favor intente de nuevo.</>
              })()}
            </Alert>
            <button
              onClick={handleNewSearch}
              className="text-sm text-primary hover:text-primary-600 underline underline-offset-2"
            >
              Realizar nueva búsqueda
            </button>
          </div>
        )}

        {/* Result */}
        {mutation.isSuccess && mutation.data && (
          <div className="space-y-4">
            <ResultCard data={mutation.data} />
            <button
              onClick={handleNewSearch}
              className="text-sm text-primary hover:text-primary-600 underline underline-offset-2"
            >
              Consultar otro expediente
            </button>
          </div>
        )}
      </div>
    </>
  )
}
