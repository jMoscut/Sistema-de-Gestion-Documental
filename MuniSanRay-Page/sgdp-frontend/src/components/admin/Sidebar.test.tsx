import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}))

const mockUseAuth = useAuth as jest.Mock

function renderSidebar(rol: 'ADMINISTRADOR' | 'OFICIAL' | 'FUNCIONARIO') {
  mockUseAuth.mockReturnValue({ user: { rol } })
  return render(
    <MemoryRouter>
      <Sidebar mobileOpen={false} onMobileClose={jest.fn()} />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('ADMINISTRADOR ve todos los enlaces', () => {
    renderSidebar('ADMINISTRADOR')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Solicitudes LAIP')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Auditoría')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
  })

  it('FUNCIONARIO no ve enlaces restringidos', () => {
    renderSidebar('FUNCIONARIO')
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Información de Oficio')).toBeInTheDocument()
    expect(screen.queryByText('Solicitudes LAIP')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Auditoría')).not.toBeInTheDocument()
  })

  it('OFICIAL ve solicitudes y reportes pero no usuarios/auditoría', () => {
    renderSidebar('OFICIAL')
    expect(screen.getByText('Solicitudes LAIP')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Auditoría')).not.toBeInTheDocument()
  })

  it('colapsa y expande el menú al hacer clic en el toggle', () => {
    renderSidebar('ADMINISTRADOR')
    const toggle = screen.getByTitle('Contraer menú')
    fireEvent.click(toggle)
    expect(screen.getByTitle('Expandir menú')).toBeInTheDocument()
  })

  it('sin usuario no muestra enlaces con roles restringidos', () => {
    mockUseAuth.mockReturnValue({ user: null })
    render(
      <MemoryRouter>
        <Sidebar mobileOpen={false} onMobileClose={jest.fn()} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
