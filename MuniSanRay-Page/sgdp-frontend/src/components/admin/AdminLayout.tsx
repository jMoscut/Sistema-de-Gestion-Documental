import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuToggle={() => setMobileOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
