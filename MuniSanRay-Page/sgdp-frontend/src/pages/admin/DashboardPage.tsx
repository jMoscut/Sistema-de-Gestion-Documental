import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Inbox, CheckCircle2, Clock, BookOpen, TrendingUp, Pencil, X, Check, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { dashboardService } from '../../services/dashboard.service'
import { useAuth } from '../../hooks/useAuth'
import type { MetaModulo } from '../../types/dashboard.types'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  bg: string
  sub?: string
}

function StatCard({ label, value, icon, color, bg, sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function barColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#652681'
  return '#d97706'
}

interface ModuleBarProps {
  item: MetaModulo
  isAdmin: boolean
}

function ModuleBar({ item, isAdmin }: ModuleBarProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(item.meta.toString())
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      dashboardService.actualizarMeta(item.modulo, parseInt(inputValue, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metas'] })
      setEditing(false)
    },
  })

  const color = barColor(item.porcentaje)

  function openEdit() {
    setInputValue(item.meta.toString())
    setEditing(true)
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">
          {item.etiqueta}
        </span>

        {editing ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-500">Meta:</span>
            <input
              type="number"
              min={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-16 text-sm border border-gray-300 rounded px-1.5 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') mutation.mutate()
                if (e.key === 'Escape') setEditing(false)
              }}
              autoFocus
            />
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="text-green-600 hover:text-green-700 disabled:opacity-50"
              title="Guardar"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Cancelar"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">
              {item.actual}/{item.meta}
            </span>
            <span className="text-sm font-bold" style={{ color }}>
              {item.porcentaje}%
            </span>
            {isAdmin && (
              <button
                onClick={openEdit}
                className="text-gray-400 hover:text-primary transition-colors"
                title="Editar meta"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${item.porcentaje}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function AlertaCarpetasDesactualizadas({ count, nombres }: { count: number; nombres: string[] }) {
  const [expanded, setExpanded] = useState(false)
  if (count === 0) return null
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            {count} carpeta{count !== 1 ? 's' : ''} de oficio sin actualizar en los últimos 25 días
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Revisar y publicar nuevos documentos para mantener el cumplimiento LAIP.
          </p>
          {nombres.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 mt-2 font-medium"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Ocultar' : 'Ver carpetas'}
            </button>
          )}
          {expanded && (
            <ul className="mt-2 space-y-0.5">
              {nombres.map((n, i) => (
                <li key={i} className="text-xs text-amber-800 pl-2 border-l-2 border-amber-300">
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'ADMINISTRADOR'

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 60_000,
  })

  const { data: metas, isLoading: metasLoading } = useQuery({
    queryKey: ['dashboard-metas'],
    queryFn: dashboardService.getMetas,
    refetchInterval: 60_000,
  })

  const fmt = (n?: number) => (isLoading ? '—' : (n ?? 0).toString())

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del sistema en tiempo real</p>
      </div>

      <AlertaCarpetasDesactualizadas
        count={data?.carpetasDesactualizadasCount ?? 0}
        nombres={data?.carpetasDesactualizadas ?? []}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard
          label="Solicitudes Pendientes"
          value={fmt(data?.solicitudesPendientes)}
          icon={<Inbox size={20} />}
          color="text-yellow-600"
          bg="bg-yellow-50"
          sub="Requieren atención"
        />
        <StatCard
          label="En Proceso"
          value={fmt(data?.solicitudesEnProceso)}
          icon={<Clock size={20} />}
          color="text-blue-600"
          bg="bg-blue-50"
          sub="Asignadas o prorrogadas"
        />
        <StatCard
          label="Respondidas"
          value={fmt(data?.solicitudesRespondidas)}
          icon={<CheckCircle2 size={20} />}
          color="text-green-600"
          bg="bg-green-50"
          sub="Solicitudes cerradas"
        />
        <StatCard
          label="Total Solicitudes"
          value={fmt(data?.solicitudesTotal)}
          icon={<TrendingUp size={20} />}
          color="text-gray-700"
          bg="bg-gray-100"
        />
        <StatCard
          label="Total Documentos"
          value={fmt(data?.documentosTotal)}
          icon={<FileText size={20} />}
          color="text-primary"
          bg="bg-primary/10"
          sub="En repositorio"
        />
        <StatCard
          label="Cumplimiento LAIP"
          value={isLoading ? '—' : `${data?.porcentajeCumplimiento ?? 0}%`}
          icon={<BookOpen size={20} />}
          color="text-primary"
          bg="bg-primary/10"
          sub={`${data?.oficioPublicadas ?? 0}/29 categorías con contenido`}
        />
      </div>

      {/* Metas de cumplimiento por módulo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">
              Metas de Cumplimiento por Módulo
            </h2>
            {isAdmin && (
              <p className="text-xs text-gray-400 mt-0.5">
                Haz clic en el ícono de lápiz para editar la meta de cualquier módulo
              </p>
            )}
          </div>
        </div>

        {metasLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1.5">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-2 bg-gray-200 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {metas?.map((item) => (
              <ModuleBar key={item.modulo} item={item} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
