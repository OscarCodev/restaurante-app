import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductoForm from '@/components/admin/ProductoForm'

describe('ProductoForm', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('crea un producto y llama onSuccess', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    const onCancel = jest.fn()

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'prod-1' }),
    })

    render(<ProductoForm onSuccess={onSuccess} onCancel={onCancel} />)

    const [nombreInput, descripcionInput] = screen.getAllByRole('textbox')
    await user.type(nombreInput, 'Ceviche')
    await user.type(descripcionInput, 'Pescado fresco')
    await user.type(screen.getByRole('spinbutton'), '32.50')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/productos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Ceviche',
          descripcion: 'Pescado fresco',
          precio: 32.5,
          categoria: 'principal',
        }),
      })
    )
  })

  it('actualiza un producto existente y usa PATCH', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    const onCancel = jest.fn()
    const producto = {
      id: 'prod-2',
      nombre: 'Lomo saltado',
      descripcion: 'Clásico',
      precio: 28,
      categoria: 'principal',
      activo: true,
      created_at: '',
    } as const

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'prod-2' }),
    })

    render(<ProductoForm producto={producto} onSuccess={onSuccess} onCancel={onCancel} />)

    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
    await user.clear(screen.getAllByRole('textbox')[0])
    await user.type(screen.getAllByRole('textbox')[0], 'Lomo saltado especial')
    await user.click(screen.getByRole('button', { name: /actualizar/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/productos/prod-2',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('muestra error cuando la API falla y permite cancelar', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    const onCancel = jest.fn()

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Nombre requerido' }),
    })

    render(<ProductoForm onSuccess={onSuccess} onCancel={onCancel} />)

    await user.type(screen.getAllByRole('textbox')[0], 'Agua')
    await user.type(screen.getByRole('spinbutton'), '5')
    await user.click(screen.getByRole('button', { name: /crear/i }))

    expect(await screen.findByText('Nombre requerido')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})