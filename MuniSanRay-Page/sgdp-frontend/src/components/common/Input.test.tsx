import { render, screen, fireEvent } from '@testing-library/react'
import Input from './Input'

describe('Input', () => {
  it('renderiza label y genera id desde el label', () => {
    render(<Input label="Nombre Completo" />)
    const input = screen.getByLabelText('Nombre Completo')
    expect(input).toHaveAttribute('id', 'nombre-completo')
  })

  it('usa id explícito si se provee', () => {
    render(<Input label="Correo" id="correo-custom" />)
    expect(screen.getByLabelText('Correo')).toHaveAttribute('id', 'correo-custom')
  })

  it('muestra mensaje de error', () => {
    render(<Input label="Correo" error={{ type: 'required', message: 'El correo es obligatorio' }} />)
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument()
  })

  it('no muestra mensaje de error cuando no hay error', () => {
    render(<Input label="Correo" />)
    expect(screen.queryByText(/obligatorio/)).not.toBeInTheDocument()
  })

  it('acepta input del usuario', () => {
    render(<Input label="Nombre" />)
    const input = screen.getByLabelText('Nombre') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Juan' } })
    expect(input.value).toBe('Juan')
  })
})
