import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Inbox,
  BookOpen,
  Users,
  Shield,
  BarChart2,
  Building2,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { Rol } from '../../types/auth.types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  roles?: Rol[]
}

const navItems: NavItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/documentos', icon: FileText, label: 'Documentos' },
  { to: '/admin/solicitudes', icon: Inbox, label: 'Solicitudes LAIP', roles: ['ADMINISTRADOR', 'OFICIAL'] },
  { to: '/admin/oficio', icon: BookOpen, label: 'Información de Oficio', roles: ['ADMINISTRADOR', 'OFICIAL', 'FUNCIONARIO'] },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { to: '/admin/auditoria', icon: Shield, label: 'Auditoría', roles: ['ADMINISTRADOR'] },
  { to: '/admin/reportes', icon: BarChart2, label: 'Reportes', roles: ['ADMINISTRADOR', 'OFICIAL'] },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={[
        'fixed md:static inset-y-0 left-0 z-30',
        'flex flex-col shrink-0 bg-primary-900 text-white',
        'transition-all duration-200',
        // mobile: drawer in/out
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        // desktop: full or icon-only
        collapsed ? 'md:w-16' : 'md:w-64',
        // mobile always full width when open
        'w-64',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-primary-700 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-white rounded-lg shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white leading-tight">Municipalidad</p>
            <p className="text-xs text-primary-300 leading-tight truncate">San Raymundo</p>
          </div>
        )}
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex items-center justify-center p-1 rounded text-primary-300 hover:text-white hover:bg-primary-700 shrink-0"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          if (item.roles && (!user || !item.roles.includes(user.rol))) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onClick={mobileOpen ? onMobileClose : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-200 hover:bg-primary-700 hover:text-white',
                ].join(' ')
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-primary-700 shrink-0">
          <p className="text-xs text-primary-400 text-center">SGDP v1.0</p>
        </div>
      )}
    </aside>
  )
}
