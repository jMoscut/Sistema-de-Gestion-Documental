import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from './PublicLayout'

describe('PublicLayout', () => {
  it('renderiza Outlet con el contenido de la ruta hija', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<div>Contenido Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Contenido Inicio')).toBeInTheDocument()
  })

  it('muestra los enlaces de navegación desktop', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Información Pública').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Presentar Solicitud').length).toBeGreaterThan(0)
  })

  it('abre y cierra el menú móvil al hacer clic en el hamburguesa', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    const toggle = screen.getByLabelText('Abrir menú')
    fireEvent.click(toggle)
    // en móvil abierto hay enlaces duplicados (desktop oculto + mobile dropdown)
    expect(screen.getAllByText('Seguimiento').length).toBeGreaterThan(1)

    fireEvent.click(toggle)
    expect(screen.getAllByText('Seguimiento').length).toBe(1)
  })

  it('muestra el footer institucional', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Municipalidad de San Raymundo, Guatemala')).toBeInTheDocument()
  })
})
