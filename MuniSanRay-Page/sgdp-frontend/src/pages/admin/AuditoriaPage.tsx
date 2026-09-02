import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ShieldAlert, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

import Button from '../../components/common/Button'
import { auditoriaService } from '../../services/auditoria.service'
import { ACCIONES_AUDITORIA } from '../../types/auditoria.types'
import type { AuditoriaResponse, ResultadoAuditoria, AuditoriaFiltros } from '../../types/auditoria.types'

// ── Helpers ─────────────────────────────────────────────────────────────────────

const RESULTADO_BADGE: Record<ResultadoAuditoria, string> = {
  EXITO: 'bg-green-100 text-green-800',
  FALLO: 'bg-red-100 text-red-700',
  DENEGADO: 'bg-amber-100 text-amber-800',
}

function formatTs(ts: string): string {
  try {
    return format(parseISO(ts), 'dd/MM/yyyy HH:mm:ss')
  } catch {
    return ts
  }
}

/** Append :00 to datetime-local values like "2026-07-18T00:00" */
function toIsoSeconds(val: string): string {
  if (!val) return val
  return val.length === 16 ? `${val}:00` : val
}

// ── Detalle Modal ───────────────────────────────────────────────────────────────

function DetalleModal({ detalle, onClose }: { detalle: string; onClose: () => void }) {
  let formatted = detalle
  try {
    formatted = JSON.stringify(JSON.parse(detalle), null, 2)
  } catch {
    // leave as-is
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Detalle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <pre className="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all text-gray-800 border border-gray-200">
            {formatted}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const [page, setPage] = useState(0)
  const [filtros, setFiltros] = useState<AuditoriaFiltros>({ page: 0, size: 50 })
  const [detalleJson, setDetalleJson] = useState<string | null>(null)

  // Local filter form state
  const [accion, setAccion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const queryFiltros: AuditoriaFiltros = { ...filtros, page }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auditoria', queryFiltros],
    queryFn: () => auditoriaService.listar(queryFiltros),
  })

  const handleFiltrar = () => {
    const next: AuditoriaFiltros = { size: 50 }
    if (accion) next.accion = accion
    if (desde) next.desde = toIsoSeconds(desde)
    if (hasta) next.hasta = toIsoSeconds(hasta)
    setPage(0)
    setFiltros(next)
  }

  const handleLimpiar = () => {
    setAccion('')
    setDesde('')
    setHasta('')
    setPage(0)
    setFiltros({ size: 50 })
  }

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const COLS = 7

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registro inmutable de todas las acciones del sistema
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Acción */}
          <div className="w-56">
            <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Todas</option>
              {ACCIONES_AUDITORIA.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Desde */}
          <div className="w-52">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="datetime-local"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Hasta */}
          <div className="w-52">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="datetime-local"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleFiltrar}>
              <Filter size={16} />
              Filtrar
            </Button>
            {(accion || desde || hasta) && (
              <Button variant="ghost" onClick={handleLimpiar}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Timestamp', 'Usuario', 'IP', 'Acción', 'Objeto', 'Resultado', 'Detalle'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: COLS }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td colSpan={COLS} className="px-4 py-8 text-center text-red-600">
                    Error al cargar el registro de auditoría. Intente nuevamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.content.length === 0 && (
                <tr>
                  <td colSpan={COLS} className="px-4 py-12 text-center text-gray-400">
                    <ShieldAlert size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No se encontraron registros</p>
                    <p className="text-xs mt-1">Ajuste los filtros para ampliar la búsqueda.</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                data?.content.map((entry: AuditoriaResponse) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs font-mono">
                      {formatTs(entry.timestampUtc)}
                    </td>

                    {/* Usuario */}
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[140px]">
                      <span className="truncate block" title={entry.usuarioDesc}>
                        {entry.usuarioDesc ?? '—'}
                      </span>
                    </td>

                    {/* IP */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs font-mono">
                      {entry.ipOrigen ?? '—'}
                    </td>

                    {/* Acción */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                        {entry.accion}
                      </span>
                    </td>

                    {/* Objeto */}
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px]">
                      {entry.objetoTipo && entry.objetoId ? (
                        <span
                          className="truncate block"
                          title={`${entry.objetoTipo} #${entry.objetoId}${entry.objetoDesc ? ` — ${entry.objetoDesc}` : ''}`}
                        >
                          {entry.objetoTipo} #{entry.objetoId}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Resultado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESULTADO_BADGE[entry.resultado]}`}
                      >
                        {entry.resultado}
                      </span>
                    </td>

                    {/* Detalle */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {entry.detalle ? (
                        <button
                          onClick={() => setDetalleJson(entry.detalle!)}
                          className="text-xs text-primary hover:text-primary-600 underline underline-offset-2 transition-colors"
                        >
                          Ver
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
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
              Página {currentPage + 1} de {totalPages} — {data.totalElements} registros
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

      {/* Detalle modal */}
      {detalleJson && (
        <DetalleModal detalle={detalleJson} onClose={() => setDetalleJson(null)} />
      )}
    </div>
  )
}
