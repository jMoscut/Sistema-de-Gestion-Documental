import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgdp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as { response?: { status?: number } }
    if (axiosError.response?.status === 401) {
      localStorage.removeItem('sgdp_token')
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
