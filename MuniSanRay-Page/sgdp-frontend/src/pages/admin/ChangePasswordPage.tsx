import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Alert from '../../components/common/Alert'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/

const schema = z
  .object({
    contrasenaActual: z.string().min(1, 'La contraseña actual es requerida'),
    contrasenaNueva: z
      .string()
      .regex(
        passwordRegex,
        'Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial',
      ),
    confirmarContrasena: z.string().min(1, 'Confirme la nueva contraseña'),
  })
  .refine((data) => data.contrasenaNueva === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  })

type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { clearRequiereCambioContrasena } = useAuth()
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
      await authService.cambiarContrasena({
        contrasenaActual: data.contrasenaActual,
        contrasenaNueva: data.contrasenaNueva,
      })
      clearRequiereCambioContrasena()
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error ?? 'Error al cambiar la contraseña. Intente nuevamente.')
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Cambio de Contraseña Requerido</h1>
          <p className="text-primary-200 mt-1 text-sm">
            Por seguridad, debe establecer una nueva contraseña antes de continuar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              autoComplete="current-password"
              error={errors.contrasenaActual}
              {...register('contrasenaActual')}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.contrasenaNueva}
              {...register('contrasenaNueva')}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              error={errors.confirmarContrasena}
              {...register('confirmarContrasena')}
            />

            <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
              Actualizar Contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
