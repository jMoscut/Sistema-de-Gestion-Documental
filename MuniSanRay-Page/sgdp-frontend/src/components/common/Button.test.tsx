import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  it('llama onClick al hacer clic', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('se deshabilita cuando loading es true', () => {
    render(<Button loading>Guardar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('se deshabilita cuando disabled es true', () => {
    render(<Button disabled>Guardar</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('aplica variant danger', () => {
    render(<Button variant="danger">Eliminar</Button>)
    expect(screen.getByRole('button').className).toContain('bg-red-600')
  })

  it('aplica size lg', () => {
    render(<Button size="lg">Grande</Button>)
    expect(screen.getByRole('button').className).toContain('px-6')
  })
})
