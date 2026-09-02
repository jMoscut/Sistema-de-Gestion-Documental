import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Clock, AlertTriangle, BookOpen } from 'lucide-react'
import { notificacionesService } from '../../services/notificaciones.service'
import type { NotificacionResponse, TipoNotificacion } from '../../types/notificaciones.types'

const ICONOS: Record<TipoNotificacion, React.ElementType> = {
  SOLICITUD_POR_VENCER: Clock,
  SOLICITUD_VENCIDA: AlertTriangle,
  OFICIO_DESACTUALIZADO: BookOpen,
}

const COLORES: Record<TipoNotificacion, string> = {
  SOLICITUD_POR_VENCER: 'text-amber-500',
  SOLICITUD_VENCIDA: 'text-red-500',
  OFICIO_DESACTUALIZADO: 'text-blue-500',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const { data: notificaciones = [] } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: notificacionesService.listar,
    refetchInterval: 60_000,
  })

  const handleClick = (n: NotificacionResponse) => {
    setOpen(false)
    if (n.tipo === 'OFICIO_DESACTUALIZADO') {
      navigate('/admin/oficio')
    } else {
      navigate('/admin/solicitudes')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {notificaciones.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold">
            {notificaciones.length > 9 ? '9+' : notificaciones.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1rem)] max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-200 z-40">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Notificaciones</p>
            </div>
            {notificaciones.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">Sin notificaciones pendientes</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notificaciones.map((n, i) => {
                  const Icono = ICONOS[n.tipo]
                  return (
                    <li key={i}>
                      <button
                        onClick={() => handleClick(n)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
                      >
                        <Icono className={`w-4 h-4 mt-0.5 shrink-0 ${COLORES[n.tipo]}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{n.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
