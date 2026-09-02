import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Building2, Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/informacion-publica', label: 'Información Pública' },
  { to: '/buscar', label: 'Documentos' },
  { to: '/solicitud', label: 'Presentar Solicitud' },
  { to: '/seguimiento', label: 'Seguimiento' },
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-primary-100 hover:text-white'}`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-sm font-medium transition-colors border-b border-primary-700 last:border-0 ${
      isActive ? 'text-accent bg-primary-800' : 'text-primary-100 hover:text-white hover:bg-primary-700'
    }`

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <nav className="bg-primary text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Building2 className="w-6 h-6 text-accent" />
            <div>
              <div className="font-bold text-sm leading-tight">Municipalidad de San Raymundo</div>
              <div className="text-primary-200 text-xs hidden sm:block">Información Pública</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded text-primary-100 hover:text-white hover:bg-primary-700"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden bg-primary-800 border-t border-primary-700">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={mobileLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-primary-900 text-primary-200 py-8 px-4 text-sm">
        <div className="max-w-7xl mx-auto text-center space-y-1">
          <p className="font-medium text-white">Municipalidad de San Raymundo, Guatemala</p>
          <p>Decreto 57-2008 · Ley de Acceso a la Información Pública (LAIP)</p>
        </div>
      </footer>
    </div>
  )
}
