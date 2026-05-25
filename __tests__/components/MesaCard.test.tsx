import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MesaCard } from '@/components/mesas/MesaCard'
import type { Mesa } from '@/types/database'

const mesaLibre: Mesa = {
  id: 'uuid-1', numero: 3, capacidad: 4,
  estado: 'libre', created_at: '2026-01-01T00:00:00Z',
}

const mesaOcupada: Mesa = {
  id: 'uuid-2', numero: 5, capacidad: 6,
  estado: 'ocupada', created_at: '2026-01-01T00:00:00Z',
}

describe('MesaCard', () => {
  it('muestra el número de mesa', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('muestra la capacidad', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText(/4 personas/i)).toBeInTheDocument()
  })

  it('muestra "Libre" cuando la mesa está libre', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText(/libre/i)).toBeInTheDocument()
  })

  it('muestra "Ocupada" cuando la mesa está ocupada', () => {
    render(<MesaCard mesa={mesaOcupada} onClick={jest.fn()} />)
    expect(screen.getByText(/ocupada/i)).toBeInTheDocument()
  })

  it('aplica clase verde cuando está libre', () => {
    const { container } = render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(container.firstChild).toHaveClass('border-green-400')
  })

  it('aplica clase roja cuando está ocupada', () => {
    const { container } = render(<MesaCard mesa={mesaOcupada} onClick={jest.fn()} />)
    expect(container.firstChild).toHaveClass('border-red-400')
  })

  it('llama a onClick al hacer clic', async () => {
    const handleClick = jest.fn()
    render(<MesaCard mesa={mesaLibre} onClick={handleClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(handleClick).toHaveBeenCalledWith(mesaLibre)
  })
})
