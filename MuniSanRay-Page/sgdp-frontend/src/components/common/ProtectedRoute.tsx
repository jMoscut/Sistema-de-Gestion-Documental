import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from './Spinner'
import type { Rol } from '../../types/auth.types'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  roles?: Rol[]
}

const CHANGE_PASSWORD_PATH = '/admin/cambiar-contrasena'

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (user?.requiereCambioContrasena && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  if (roles && user && !roles.includes(user.rol)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}
