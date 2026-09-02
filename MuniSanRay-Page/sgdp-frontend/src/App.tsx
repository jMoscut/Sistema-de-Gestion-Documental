import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import DocumentosPage from './pages/admin/DocumentosPage'
import SolicitudesPage from './pages/admin/SolicitudesPage'
import UsuariosPage from './pages/admin/UsuariosPage'
import AuditoriaPage from './pages/admin/AuditoriaPage'
import InformacionOficioAdminPage from './pages/admin/InformacionOficioPage'
import ReportesPage from './pages/admin/ReportesPage'
import ChangePasswordPage from './pages/admin/ChangePasswordPage'
import AdminLayout from './components/admin/AdminLayout'
import PublicLayout from './components/public/PublicLayout'
import HomePage from './pages/public/HomePage'
import InformacionOficioPage from './pages/public/InformacionOficioPage'
import PresentarSolicitudPage from './pages/public/PresentarSolicitudPage'
import SeguimientoPage from './pages/public/SeguimientoPage'
import BuscadorPublicoPage from './pages/public/BuscadorPublicoPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public portal with shared layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/informacion-publica" element={<InformacionOficioPage />} />
          <Route path="/solicitud" element={<PresentarSolicitudPage />} />
          <Route path="/seguimiento" element={<SeguimientoPage />} />
          <Route path="/buscar" element={<BuscadorPublicoPage />} />
        </Route>

        {/* Admin auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="cambiar-contrasena" element={<ChangePasswordPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route
            path="solicitudes"
            element={
              <ProtectedRoute roles={['ADMINISTRADOR', 'OFICIAL']}>
                <SolicitudesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="oficio"
            element={
              <ProtectedRoute roles={['ADMINISTRADOR', 'OFICIAL', 'FUNCIONARIO']}>
                <InformacionOficioAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute roles={['ADMINISTRADOR']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="auditoria"
            element={
              <ProtectedRoute roles={['ADMINISTRADOR']}>
                <AuditoriaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reportes"
            element={
              <ProtectedRoute roles={['ADMINISTRADOR', 'OFICIAL']}>
                <ReportesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
