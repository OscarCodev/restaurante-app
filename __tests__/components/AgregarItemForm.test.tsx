import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import AgregarItemForm from '@/components/pedidos/AgregarItemForm'

const productosMock = [
  { id: 'p-1', nombre: 'Lomo saltado', descripcion: null, precio: 32, categoria: 'principal', activo: true, created_at: '' },
  { id: 'p-2', nombre: 'Chicha morada', descripcion: 'Bebida morada', precio: 8.5, categoria: 'bebida', activo: true, created_at: '' },
  { id: 'p-3', nombre: 'Suspiro limeño', descripcion: null, precio: 14, categoria: 'postre', activo: true, created_at: '' },
]

function mockFetchGet() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(productosMock),
  } as Response)
}

async function renderForm(onItemAdded = jest.fn()) {
  await act(async () => {
    render(<AgregarItemForm pedidoId="ped-1" cerrado={false} onItemAdded={onItemAdded} />)
    await Promise.resolve()
  })
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('AgregarItemForm', () => {
  it('muestra "Cargando carta..." mientras carga', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {}))
    render(<AgregarItemForm pedidoId="ped-1" cerrado={false} onItemAdded={jest.fn()} />)
    expect(screen.getByText(/cargando carta/i)).toBeInTheDocument()
  })

  it('muestra todos los productos después de cargar', async () => {
    mockFetchGet()
    await renderForm()
    expect(await screen.findByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Chicha morada')).toBeInTheDocument()
    expect(screen.getByText('Suspiro limeño')).toBeInTheDocument()
  })

  it('muestra los filtros de categoría', async () => {
    mockFetchGet()
    await renderForm()
    await screen.findByText('Lomo saltado')
    expect(screen.getByRole('button', { name: /todos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bebidas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /principales/i })).toBeInTheDocument()
  })

  it('filtra productos al seleccionar una categoría', async () => {
    mockFetchGet()
    const user = userEvent.setup()
    await renderForm()
    await screen.findByText('Lomo saltado')

    await user.click(screen.getByRole('button', { name: /bebidas/i }))

    expect(screen.queryByText('Lomo saltado')).not.toBeInTheDocument()
    expect(screen.getByText('Chicha morada')).toBeInTheDocument()
  })

  it('muestra mensaje vacío si no hay productos en la categoría seleccionada', async () => {
    mockFetchGet()
    const user = userEvent.setup()
    await renderForm()
    await screen.findByText('Lomo saltado')

    await user.click(screen.getByRole('button', { name: /entradas/i }))
    expect(screen.getByText(/sin productos en esta categoría/i)).toBeInTheDocument()
  })

  it('llama a onItemAdded después de agregar un ítem con éxito', async () => {
    mockFetchGet()
    const handleItemAdded = jest.fn()
    const user = userEvent.setup()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(productosMock) } as Response)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 'det-1' }) } as Response)

    await renderForm(handleItemAdded)
    await screen.findByText('Lomo saltado')

    const botones = screen.getAllByRole('button', { name: '+' })
    await user.click(botones[0])

    await waitFor(() => expect(handleItemAdded).toHaveBeenCalledTimes(1))
  })

  it('muestra mensaje de error si la petición falla', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(productosMock) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Producto inactivo' }),
      } as Response)

    await renderForm()
    await screen.findByText('Lomo saltado')

    const botones = screen.getAllByRole('button', { name: '+' })
    await user.click(botones[0])

    await waitFor(() => expect(screen.getByText('Producto inactivo')).toBeInTheDocument())
  })

  it('muestra mensaje de pedido cerrado cuando cerrado=true', () => {
    mockFetchGet()
    render(<AgregarItemForm pedidoId="ped-1" cerrado={true} onItemAdded={jest.fn()} />)
    expect(screen.getByText(/el pedido está cerrado/i)).toBeInTheDocument()
    expect(screen.queryByText(/cargando carta/i)).not.toBeInTheDocument()
  })
})
