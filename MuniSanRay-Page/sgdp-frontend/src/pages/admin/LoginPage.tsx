import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Building2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'

const schema = z.object({
  nombreUsuario: z.string().min(1, 'El nombre de usuario es requerido'),
  contrasena: z.string().min(1, 'La contraseña es requerida'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const response = await authService.login(data)
      login(response)
      if (response.requiereCambioContrasena) {
        navigate('/admin/cambiar-contrasena', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } }
      const status = axiosErr.response?.status
      const serverMsg = axiosErr.response?.data?.error

      if (status === 403 || serverMsg?.toLowerCase().includes('bloqueada') || serverMsg?.toLowerCase().includes('bloqueado')) {
        setError(serverMsg ?? 'Cuenta bloqueada temporalmente. Intente en 15 minutos.')
      } else if (status === 401 || status === 400 || status === 404) {
        setError(serverMsg ?? 'Credenciales incorrectas. Verifique su usuario y contraseña.')
      } else if (!axiosErr.response) {
        setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.')
      } else {
        setError(serverMsg ?? 'Error al conectar con el servidor. Intente nuevamente.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Municipalidad de San Raymundo
          </h1>
          <p className="text-primary-200 mt-1 text-sm">
            Sistema de Gestión Documental Pública
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Acceso al Sistema
          </h2>

          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre de usuario"
              type="text"
              placeholder="usuario"
              error={errors.nombreUsuario}
              autoComplete="username"
              {...register('nombreUsuario')}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm shadow-sm transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                    ${errors.contrasena ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('contrasena')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.contrasena && (
                <p className="text-xs text-red-600">{errors.contrasena.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={isSubmitting}
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
          </p>
        </div>
      </div>
    </div>
  )
}
