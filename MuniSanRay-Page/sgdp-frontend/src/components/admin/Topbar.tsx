import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Badge from '../common/Badge'
import NotificationBell from './NotificationBell'

const routeLabels: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/documentos': 'Documentos',
  '/admin/solicitudes': 'Solicitudes LAIP',
  '/admin/oficio': 'Información de Oficio',
  '/admin/usuarios': 'Usuarios',
  '/admin/auditoria': 'Auditoría',
  '/admin/reportes': 'Reportes',
}

const rolLabels: Record<string, string> = {
  ADMINISTRADOR: 'Administrador del Sistema',
  OFICIAL: 'Oficial',
  FUNCIONARIO: 'Funcionario',
}

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const currentLabel = routeLabels[location.pathname] ?? 'Admin'

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-3 flex items-center gap-3 justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Admin</span>
          <span>/</span>
          <span className="font-medium text-gray-900">{currentLabel}</span>
        </div>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        {user && (user.rol === 'ADMINISTRADOR' || user.rol === 'OFICIAL') && <NotificationBell />}
        {user && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm font-medium text-gray-900">{user.nombre}</span>
            <Badge variant="info">{rolLabels[user.rol] ?? user.rol}</Badge>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
