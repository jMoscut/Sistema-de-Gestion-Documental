export type RolUsuario = 'ADMINISTRADOR' | 'OFICIAL' | 'FUNCIONARIO'

export interface UsuarioResponse {
  id: number
  nombreCompleto: string
  dpi?: string
  nombreUsuario: string
  correoElectronico?: string
  rol: RolUsuario
  unidadMunicipal?: string
  activo: boolean
  requiereCambioContrasena: boolean
  intentosFallidos: number
  bloqueadoHasta?: string
  ultimoAcceso?: string
  createdAt: string
}

export interface CrearUsuarioRequest {
  nombreCompleto: string
  dpi?: string
  nombreUsuario: string
  correoElectronico?: string
  contrasena: string
  rol: RolUsuario
  unidadMunicipal?: string
}

export interface ActualizarUsuarioRequest {
  nombreCompleto: string
  nombreUsuario: string
  correoElectronico?: string
  rol: RolUsuario
  unidadMunicipal?: string
}

export interface ResetPasswordRequest {
  nuevaContrasena: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}
