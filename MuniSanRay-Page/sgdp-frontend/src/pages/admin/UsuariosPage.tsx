import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import {
  UserPlus,
  Pencil,
  KeyRound,
  LockOpen,
  Lock,
  ShieldOff,
  X,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Alert from '../../components/common/Alert'
import { usuariosService } from '../../services/usuarios.service'
import type {
  UsuarioResponse,
  RolUsuario,
} from '../../types/usuarios.types'

// ── Badges ─────────────────────────────────────────────────────────────────────

const ROL_BADGE: Record<RolUsuario, string> = {
  ADMINISTRADOR: 'bg-purple-100 text-purple-800',
  OFICIAL: 'bg-blue-100 text-blue-800',
  FUNCIONARIO: 'bg-slate-100 text-slate-700',
}

// ── Zod schemas ────────────────────────────────────────────────────────────────

const NOMBRE_USUARIO_REGEX = /^[A-Za-z][A-Za-z0-9_.-]{3,49}$/
const nombreUsuarioField = z
  .string()
  .regex(
    NOMBRE_USUARIO_REGEX,
    'Debe iniciar con letra, mínimo 4 caracteres, solo letras, números, \'.\', \'_\' y \'-\'',
  )
const correoOpcionalField = z
  .string()
  .email('Correo electrónico inválido')
  .optional()
  .or(z.literal(''))

const crearSchema = z.object({
  nombreCompleto: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  nombreUsuario: nombreUsuarioField,
  correoElectronico: correoOpcionalField,
  contrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum(['ADMINISTRADOR', 'OFICIAL', 'FUNCIONARIO']),
  unidadMunicipal: z.string().max(150, 'Máximo 150 caracteres').optional(),
})

const editarSchema = z.object({
  nombreCompleto: z.string().min(2, 'Mínimo 2 caracteres').max(150, 'Máximo 150 caracteres'),
  nombreUsuario: nombreUsuarioField,
  correoElectronico: correoOpcionalField,
  rol: z.enum(['ADMINISTRADOR', 'OFICIAL', 'FUNCIONARIO']),
  unidadMunicipal: z.string().max(150, 'Máximo 150 caracteres').optional(),
})

const resetPasswordSchema = z.object({
  nuevaContrasena: z.string().min(8, 'Mínimo 8 caracteres'),
})

type CrearFormValues = z.infer<typeof crearSchema>
type EditarFormValues = z.infer<typeof editarSchema>
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

// ── Shared Modal wrapper ────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Select helper ───────────────────────────────────────────────────────────────

const SelectField = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string
    error?: { message?: string }
    children: React.ReactNode
  }
>(({ label, error, children, ...rest }, ref) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  )
})
SelectField.displayName = 'SelectField'

// ── CreateModal ─────────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CrearFormValues>({
    resolver: zodResolver(crearSchema),
    defaultValues: { rol: 'FUNCIONARIO' },
  })

  const mutation = useMutation({
    mutationFn: (data: CrearFormValues) =>
      usuariosService.crear({
        nombreCompleto: data.nombreCompleto,
        nombreUsuario: data.nombreUsuario,
        correoElectronico: data.correoElectronico || undefined,
        contrasena: data.contrasena,
        rol: data.rol,
        unidadMunicipal: data.unidadMunicipal || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onClose()
    },
  })

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="p-6 space-y-4"
      >
        <Input
          label="Nombre completo *"
          placeholder="Ej: Juan Pérez López"
          error={errors.nombreCompleto}
          {...register('nombreCompleto')}
        />
        <Input
          label="Nombre de usuario *"
          placeholder="Ej: jperez"
          error={errors.nombreUsuario}
          {...register('nombreUsuario')}
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="usuario@munisanray.gob.gt"
          error={errors.correoElectronico}
          {...register('correoElectronico')}
        />
        <Input
          label="Contraseña *"
          type="password"
          placeholder="Mínimo 8 caracteres"
          error={errors.contrasena}
          {...register('contrasena')}
        />
        <SelectField label="Rol *" error={errors.rol} {...register('rol')}>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="OFICIAL">Oficial</option>
          <option value="FUNCIONARIO">Funcionario</option>
        </SelectField>
        <Input
          label="Unidad municipal"
          placeholder="Ej: Dirección Municipal de Planificación"
          error={errors.unidadMunicipal}
          {...register('unidadMunicipal')}
        />

        {mutation.isError && (
          <Alert type="error">
            {(mutation.error as { response?: { data?: { error?: string; detalle?: string } } } | null)
              ?.response?.data?.error ?? 'Error al crear el usuario. Verifique los datos e intente nuevamente.'}
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <UserPlus size={16} />
            Crear usuario
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── EditModal ───────────────────────────────────────────────────────────────────

function EditModal({ usuario, onClose }: { usuario: UsuarioResponse; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { user, logout } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditarFormValues>({
    resolver: zodResolver(editarSchema),
    defaultValues: {
      nombreCompleto: usuario.nombreCompleto,
      nombreUsuario: usuario.nombreUsuario,
      correoElectronico: usuario.correoElectronico ?? '',
      rol: usuario.rol,
      unidadMunicipal: usuario.unidadMunicipal ?? '',
    },
  })

  const esPropioUsuario = user?.nombreUsuario === usuario.nombreUsuario
  const nombreUsuarioWatched = watch('nombreUsuario')
  const usuarioPropioCambia = esPropioUsuario && nombreUsuarioWatched !== usuario.nombreUsuario

  const mutation = useMutation({
    mutationFn: (data: EditarFormValues) =>
      usuariosService.actualizar(usuario.id, {
        nombreCompleto: data.nombreCompleto,
        nombreUsuario: data.nombreUsuario,
        correoElectronico: data.correoElectronico || undefined,
        rol: data.rol,
        unidadMunicipal: data.unidadMunicipal || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      if (usuarioPropioCambia) {
        logout()
      } else {
        onClose()
      }
    },
  })

  return (
    <Modal title="Editar usuario" onClose={onClose}>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="p-6 space-y-4"
      >
        <Input
          label="Nombre de usuario *"
          error={errors.nombreUsuario}
          {...register('nombreUsuario')}
        />
        {usuarioPropioCambia && (
          <Alert type="warning">
            Estás cambiando tu propio nombre de usuario. Al guardar, tu sesión se cerrará automáticamente y deberás iniciar sesión con el usuario nuevo.
          </Alert>
        )}
        <Input
          label="Correo electrónico"
          type="email"
          error={errors.correoElectronico}
          {...register('correoElectronico')}
        />
        <Input
          label="Nombre completo *"
          error={errors.nombreCompleto}
          {...register('nombreCompleto')}
        />
        <SelectField label="Rol *" error={errors.rol} {...register('rol')}>
          <option value="ADMINISTRADOR">Administrador</option>
          <option value="OFICIAL">Oficial</option>
          <option value="FUNCIONARIO">Funcionario</option>
        </SelectField>
        <Input
          label="Unidad municipal"
          placeholder="Ej: Dirección Municipal de Planificación"
          error={errors.unidadMunicipal}
          {...register('unidadMunicipal')}
        />

        {mutation.isError && (
          <Alert type="error">
            {(mutation.error as { response?: { data?: { error?: string } } } | null)
              ?.response?.data?.error ?? 'Error al actualizar el usuario.'}
          </Alert>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            <Pencil size={16} />
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── ResetPasswordModal ──────────────────────────────────────────────────────────

function ResetPasswordModal({
  usuario,
  onClose,
}: {
  usuario: UsuarioResponse
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormValues) =>
      usuariosService.resetPassword(usuario.id, { nuevaContrasena: data.nuevaContrasena }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      onClose()
    },
  })

  return (
    <Modal title="Restablecer contraseña" onClose={onClose}>
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-700">
          Restableciendo contraseña para:{' '}
          <span className="font-medium">{usuario.nombreCompleto}</span>
        </p>

        <Alert type="warning">
          El usuario deberá cambiar su contraseña en el próximo inicio de sesión.
        </Alert>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Nueva contraseña *"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.nuevaContrasena}
            {...register('nuevaContrasena')}
          />

          {mutation.isError && (
            <Alert type="error">
              {(mutation.error as { response?: { data?: { error?: string } } } | null)
                ?.response?.data?.error ?? 'Error al restablecer la contraseña.'}
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              <KeyRound size={16} />
              Restablecer
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editUsuario, setEditUsuario] = useState<UsuarioResponse | null>(null)
  const [resetUsuario, setResetUsuario] = useState<UsuarioResponse | null>(null)
  const [incluirInactivos, setIncluirInactivos] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['usuarios', page, incluirInactivos],
    queryFn: () => usuariosService.listar({ page, size: 20, incluirInactivos }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => usuariosService.toggleActivo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  const handleToggle = (usuario: UsuarioResponse) => {
    const accion = usuario.activo ? 'desactivar' : 'activar'
    if (window.confirm(`¿Confirmar cambio de estado? Se va a ${accion} al usuario ${usuario.nombreCompleto}.`)) {
      toggleMutation.mutate(usuario.id)
    }
  }

  const desbloquearMutation = useMutation({
    mutationFn: (id: number) => usuariosService.desbloquear(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      window.alert(axiosErr.response?.data?.error ?? 'Error al desbloquear la cuenta.')
    },
  })

  const handleDesbloquear = (usuario: UsuarioResponse) => {
    if (window.confirm(`¿Desbloquear la cuenta de ${usuario.nombreCompleto}?`)) {
      desbloquearMutation.mutate(usuario.id)
    }
  }

  const totalPages = data?.totalPages ?? 0
  const currentPage = data?.number ?? 0
  const COLS = 8

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración de cuentas del personal municipal
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={incluirInactivos}
              onChange={(e) => {
                setIncluirInactivos(e.target.checked)
                setPage(0)
              }}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Mostrar inactivos
          </label>
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus size={16} />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Nombre',
                  'Usuario',
                  'Correo',
                  'Rol',
                  'Unidad Municipal',
                  'Estado',
                  'Último acceso',
                  'Acciones',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: COLS - 1 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {isError && (
                <tr>
                  <td colSpan={COLS} className="px-4 py-8 text-center text-red-600">
                    Error al cargar los usuarios. Intente nuevamente.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.content.length === 0 && (
                <tr>
                  <td colSpan={COLS} className="px-4 py-12 text-center text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No se encontraron usuarios</p>
                    <p className="text-xs mt-1">Cree el primer usuario usando el botón superior.</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                data?.content.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900 whitespace-nowrap">
                          {u.nombreCompleto}
                        </span>
                        {u.requiereCambioContrasena && (
                          <span title="Debe cambiar contraseña" className="text-amber-500 flex-shrink-0">
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Usuario */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {u.nombreUsuario}
                    </td>

                    {/* Correo */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {u.correoElectronico ?? '—'}
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROL_BADGE[u.rol]}`}
                      >
                        {u.rol}
                      </span>
                    </td>

                    {/* Unidad */}
                    <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                      <span className="truncate block" title={u.unidadMunicipal}>
                        {u.unidadMunicipal ?? '—'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Último acceso */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {u.ultimoAcceso
                        ? format(parseISO(u.ultimoAcceso), 'dd/MM/yyyy HH:mm')
                        : '—'}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          title="Editar"
                          onClick={() => setEditUsuario(u)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          onClick={() => handleToggle(u)}
                          disabled={toggleMutation.isPending}
                          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                            u.activo
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {u.activo ? <Lock size={15} /> : <LockOpen size={15} />}
                        </button>
                        {u.bloqueadoHasta && (
                          <button
                            title="Desbloquear cuenta"
                            onClick={() => handleDesbloquear(u)}
                            disabled={desbloquearMutation.isPending}
                            className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                          >
                            <ShieldOff size={15} />
                          </button>
                        )}
                        <button
                          title="Restablecer contraseña"
                          onClick={() => setResetUsuario(u)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-accent-600 hover:bg-accent-50 transition-colors"
                        >
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Página {currentPage + 1} de {totalPages} — {data.totalElements} usuarios
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      {editUsuario && <EditModal usuario={editUsuario} onClose={() => setEditUsuario(null)} />}
      {resetUsuario && (
        <ResetPasswordModal usuario={resetUsuario} onClose={() => setResetUsuario(null)} />
      )}
    </div>
  )
}
