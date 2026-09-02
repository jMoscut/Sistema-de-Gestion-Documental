import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { LoginResponse, Rol } from '../types/auth.types'
import { authService } from '../services/auth.service'

interface AuthUser {
  id: number
  nombre: string
  nombreUsuario: string
  correo: string | null
  rol: Rol
  requiereCambioContrasena: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  clearRequiereCambioContrasena: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwt(token: string): AuthUser | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as {
      userId: number
      nombre: string
      sub: string
      correo: string | null
      rol: Rol
      requiereCambioContrasena?: boolean
    }
    return {
      id: payload.userId,
      nombre: payload.nombre,
      nombreUsuario: payload.sub,
      correo: payload.correo ?? null,
      rol: payload.rol,
      requiereCambioContrasena: payload.requiereCambioContrasena ?? false,
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sgdp_token')
    if (stored) {
      const parsed = parseJwt(stored)
      if (parsed) {
        setToken(stored)
        setUser(parsed)
      } else {
        localStorage.removeItem('sgdp_token')
      }
    }
    setIsLoading(false)
  }, [])

  function login(data: LoginResponse) {
    localStorage.setItem('sgdp_token', data.token)
    const parsed = parseJwt(data.token)
    setToken(data.token)
    setUser(
      parsed
        ? { ...parsed, requiereCambioContrasena: data.requiereCambioContrasena }
        : null,
    )
  }

  function logout() {
    authService.logout().catch(() => {})
    localStorage.removeItem('sgdp_token')
    setToken(null)
    setUser(null)
  }

  function clearRequiereCambioContrasena() {
    setUser((prev) => (prev ? { ...prev, requiereCambioContrasena: false } : prev))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        clearRequiereCambioContrasena,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
