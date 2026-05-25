import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistorialTable from '@/components/admin/HistorialTable'

function crearPedido(index: number) {
  return {
    id: `pedido-${index}`,
    total: 20 + index,
    comensales: 2 + index,
    fecha_apertura: '2026-05-25T10:00:00.000Z',
    fecha_cierre: index % 2 === 0 ? '2026-05-25T11:00:00.000Z' : null,
    mesa: { numero: index + 1 },
    items: [
      {
        id: `item-${index}-1`,
        cantidad: 2,
        subtotal: 40,
        producto: { nombre: 'Lomo saltado' },
      },
    ],
  }
}

describe('HistorialTable', () => {
  it('muestra el estado vacío cuando no hay pedidos', () => {
    render(<HistorialTable pedidos={[]} />)
    expect(screen.getByText(/no hay pedidos en este rango de fechas/i)).toBeInTheDocument()
  })

  it('paginado y detalle del pedido', async () => {
    const user = userEvent.setup()
    const pedidos = Array.from({ length: 11 }, (_, index) => crearPedido(index))

    render(<HistorialTable pedidos={pedidos} />)

    expect(screen.getByText(/1–10 de 11 pedidos/i)).toBeInTheDocument()
    expect(screen.getByText('Mesa 1')).toBeInTheDocument()
    expect(screen.queryByText('Mesa 11')).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /detalle/i })[0])
    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ocultar/i }))
    expect(screen.queryByText('×2')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    expect(screen.getByText('Mesa 11')).toBeInTheDocument()
  })
})