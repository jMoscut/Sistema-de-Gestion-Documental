import { render, screen } from '@testing-library/react'
import Badge from './Badge'

describe('Badge', () => {
  it('renderiza el texto', () => {
    render(<Badge variant="active">Activo</Badge>)
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('aplica estilos según variant expired', () => {
    render(<Badge variant="expired">Vencida</Badge>)
    expect(screen.getByText('Vencida').className).toContain('bg-red-100')
  })

  it('aplica estilos según variant responded', () => {
    render(<Badge variant="responded">Respondida</Badge>)
    expect(screen.getByText('Respondida').className).toContain('bg-green-100')
  })

  it('aplica estilos según variant pending', () => {
    render(<Badge variant="pending">Pendiente</Badge>)
    expect(screen.getByText('Pendiente').className).toContain('bg-yellow-100')
  })
})
