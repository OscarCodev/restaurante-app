import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Badge from '@/components/ui/Badge'
import Drawer from '@/components/ui/Drawer'
import EmptyState from '@/components/ui/EmptyState'

describe('Shared UI components', () => {
  it('renderiza Badge con variantes', () => {
    const { rerender } = render(<Badge>Activo</Badge>)
    expect(screen.getByText('Activo')).toHaveClass('bg-slate-100')

    rerender(<Badge variant="green">Disponible</Badge>)
    expect(screen.getByText('Disponible')).toHaveClass('bg-green-100')
  })

  it('Drawer muestra contenido y dispara onClose desde overlay y botón', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    const { container } = render(
      <Drawer open title="Panel" onClose={onClose}>
        <p>Contenido</p>
      </Drawer>
    )

    expect(screen.getByText('Panel')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()

    await user.click(container.firstChild as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('Drawer oculto mantiene la clase de salida y EmptyState renderiza descripción', () => {
    const { container } = render(
      <Drawer open={false} title="Panel" onClose={jest.fn()}>
        <p>Contenido</p>
      </Drawer>
    )

    expect(container.querySelector('[class*="translate-x-full"]')).toBeInTheDocument()

    render(<EmptyState mensaje="Sin datos" descripcion="Intenta otro filtro" />)
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(screen.getByText('Intenta otro filtro')).toBeInTheDocument()
  })
})