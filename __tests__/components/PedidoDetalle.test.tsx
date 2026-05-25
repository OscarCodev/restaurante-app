import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PedidoDetalle } from '@/components/pedidos/PedidoDetalle'

const itemsMock = [
  {
    id: 'item-1', pedido_id: 'p-1', producto_id: 'prod-1',
    cantidad: 2, precio_unitario: 32.00, subtotal: 64.00,
    created_at: '',
    producto: { id: 'prod-1', nombre: 'Lomo saltado', categoria: 'principal' },
  },
  {
    id: 'item-2', pedido_id: 'p-1', producto_id: 'prod-2',
    cantidad: 1, precio_unitario: 8.50, subtotal: 8.50,
    created_at: '',
    producto: { id: 'prod-2', nombre: 'Chicha morada', categoria: 'bebida' },
  },
]

describe('PedidoDetalle', () => {
  it('muestra todos los ítems del pedido', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Chicha morada')).toBeInTheDocument()
  })

  it('muestra el total correctamente formateado', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText('S/ 72.50')).toBeInTheDocument()
  })

  it('el botón Cobrar está habilitado cuando hay ítems', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByRole('button', { name: /cobrar/i })).toBeEnabled()
  })

  it('el botón Cobrar está deshabilitado cuando no hay ítems', () => {
    render(
      <PedidoDetalle items={[]} total={0}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByRole('button', { name: /cobrar/i })).toBeDisabled()
  })

  it('llama a onEliminar con el id correcto al eliminar un ítem', async () => {
    const handleEliminar = jest.fn()
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={handleEliminar} onCobrar={jest.fn()} />
    )
    const botonesEliminar = screen.getAllByRole('button', { name: /eliminar/i })
    await userEvent.click(botonesEliminar[0])
    expect(handleEliminar).toHaveBeenCalledWith('item-1')
  })

  it('llama a onCobrar al confirmar el cobro', async () => {
    const handleCobrar = jest.fn()
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={handleCobrar} />
    )
    await userEvent.click(screen.getByRole('button', { name: /cobrar/i }))
    expect(handleCobrar).toHaveBeenCalledTimes(1)
  })

  it('muestra empty state cuando no hay ítems', () => {
    render(
      <PedidoDetalle items={[]} total={0}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText(/no hay ítems/i)).toBeInTheDocument()
  })
})
