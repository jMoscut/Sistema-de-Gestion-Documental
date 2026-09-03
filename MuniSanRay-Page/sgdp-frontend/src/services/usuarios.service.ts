import api from './api'
import type {
  UsuarioResponse,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest,
  ResetPasswordRequest,
  PageResponse,
} from '../types/usuarios.types'

export interface ListarUsuariosParams {
  page?: number
  size?: number
  incluirInactivos?: boolean
}

export const usuariosService = {
  listar(params: ListarUsuariosParams = {}): Promise<PageResponse<UsuarioResponse>> {
    return api
      .get('/usuarios', {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          incluirInactivos: params.incluirInactivos ?? false,
        },
      })
      .then((r) => r.data)
  },

  crear(body: CrearUsuarioRequest): Promise<UsuarioResponse> {
    return api.post('/usuarios', body).then((r) => r.data)
  },

  actualizar(id: number, body: ActualizarUsuarioRequest): Promise<UsuarioResponse> {
    return api.put(`/usuarios/${id}`, body).then((r) => r.data)
  },

  toggleActivo(id: number): Promise<UsuarioResponse> {
    return api.put(`/usuarios/${id}/toggle-activo`).then((r) => r.data)
  },

  desbloquear(id: number): Promise<UsuarioResponse> {
    return api.put(`/usuarios/${id}/desbloquear`).then((r) => r.data)
  },

  resetPassword(id: number, body: ResetPasswordRequest): Promise<void> {
    return api.put(`/usuarios/${id}/reset-password`, body).then((r) => r.data)
  },
}
