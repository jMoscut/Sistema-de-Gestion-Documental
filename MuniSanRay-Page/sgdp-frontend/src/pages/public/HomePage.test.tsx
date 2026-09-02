import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renderiza el título principal', () => {
    render(<HomePage />, { wrapper: MemoryRouter })
    expect(screen.getByText('Portal de Transparencia Municipal')).toBeInTheDocument()
  })

  it('renderiza las cuatro tarjetas de acceso rápido con sus enlaces', () => {
    render(<HomePage />, { wrapper: MemoryRouter })

    expect(screen.getByText('Información Pública').closest('a')).toHaveAttribute('href', '/informacion-publica')
    expect(screen.getByText('Presentar Solicitud').closest('a')).toHaveAttribute('href', '/solicitud')
    expect(screen.getByText('Seguimiento').closest('a')).toHaveAttribute('href', '/seguimiento')
    expect(screen.getByText('Buscar Documentos').closest('a')).toHaveAttribute('href', '/buscar')
  })
})
