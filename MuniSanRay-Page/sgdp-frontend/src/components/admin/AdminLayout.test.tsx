import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import { useAuth } from '../../context/AuthContext'
import { notificacionesService } from '../../services/notificaciones.service'

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))
jest.mock('../../services/notificaciones.service')

const mockUseAuth = useAuth as jest.Mock
const mockNotificacionesService = notificacionesService as jest.Mocked<typeof notificacionesService>

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { nombre: 'Ana', rol: 'ADMINISTRADOR' }, logout: jest.fn() })
    mockNotificacionesService.listar.mockResolvedValue([])
  })

  it('renderiza Outlet con el contenido de la ruta hija', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Contenido Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper },
    )
    expect(screen.getByText('Contenido Dashboard')).toBeInTheDocument()
  })

  it('abre y cierra el menú móvil', () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { wrapper },
    )

    fireEvent.click(screen.getByLabelText('Abrir menú'))
    // overlay móvil debe existir cuando el menú está abierto
    const overlay = document.querySelector('.bg-black\\/50')
    expect(overlay).toBeInTheDocument()

    fireEvent.click(overlay as Element)
    expect(document.querySelector('.bg-black\\/50')).not.toBeInTheDocument()
  })
})
