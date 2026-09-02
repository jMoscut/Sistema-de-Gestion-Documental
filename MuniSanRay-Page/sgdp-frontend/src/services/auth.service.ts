import api from './api'
import type { LoginRequest, LoginResponse } from '../types/auth.types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  logout: () => api.post('/auth/logout'),

  cambiarContrasena: (data: { contrasenaActual: string; contrasenaNueva: string }) =>
    api.post('/auth/cambiar-contrasena', data).then((r) => r.data),
}
