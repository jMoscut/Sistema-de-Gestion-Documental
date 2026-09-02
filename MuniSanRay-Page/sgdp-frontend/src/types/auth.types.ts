export interface LoginRequest {
  nombreUsuario: string
  contrasena: string
}

export interface LoginResponse {
  token: string
  rol: 'ADMINISTRADOR' | 'OFICIAL' | 'FUNCIONARIO'
  nombre: string
  requiereCambioContrasena: boolean
}

export type Rol = 'ADMINISTRADOR' | 'OFICIAL' | 'FUNCIONARIO'
