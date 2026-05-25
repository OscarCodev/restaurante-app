import { createClient as createServerClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

type MockQuery = {
  select: jest.Mock
  order: jest.Mock
  eq: jest.Mock
  gte: jest.Mock
  lte: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
  then: (resolve: (value: any) => void, reject: (reason?: unknown) => void) => Promise<void>
}

function createQuery(result: { data?: any; error?: any } = {}): MockQuery {
  const query = {} as MockQuery & Record<string, jest.Mock>
  ;['select', 'order', 'eq', 'gte', 'lte', 'insert', 'update', 'delete'].forEach(method => {
    query[method] = jest.fn(() => query)
  })
  query.single = jest.fn(() => Promise.resolve(result))
  query.maybeSingle = jest.fn(() => Promise.resolve(result))
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return query
}

describe('Supabase services', () => {
  const mockCreateClient = createServerClient as unknown as jest.Mock
  const mockSupabase = { from: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSupabase)
  })

  it('cubre helpers de productos y mesas', async () => {
    const productosModule = await import('@/lib/supabase/productos')
    const mesasModule = await import('@/lib/supabase/mesas')

    const producto = {
      id: 'prod-1', nombre: 'Lomo saltado', descripcion: null,
      precio: 32, categoria: 'principal', activo: true, created_at: '',
    }
    const mesa = {
      id: 'mesa-1', numero: 1, capacidad: 4, estado: 'libre', created_at: '',
    }

    mockSupabase.from
      .mockImplementationOnce(() => createQuery({ data: [producto], error: null }))
      .mockImplementationOnce(() => createQuery({ data: producto, error: null }))
      .mockImplementationOnce(() => createQuery({ data: producto, error: null }))
      .mockImplementationOnce(() => createQuery({ data: producto, error: null }))
      .mockImplementationOnce(() => createQuery({ data: [mesa], error: null }))
      .mockImplementationOnce(() => createQuery({ data: mesa, error: null }))
      .mockImplementationOnce(() => createQuery({ data: mesa, error: null }))
      .mockImplementationOnce(() => createQuery({ error: null }))
      .mockImplementationOnce(() => createQuery({ data: mesa, error: null }))

    await expect(productosModule.getProductos()).resolves.toEqual([producto])
    await expect(productosModule.getProductoById('prod-1')).resolves.toEqual(producto)
    await expect(productosModule.crearProducto({
      nombre: 'Lomo saltado', descripcion: null, precio: 32, categoria: 'principal',
    })).resolves.toEqual(producto)
    await expect(productosModule.editarProducto('prod-1', { nombre: 'Lomo' })).resolves.toEqual(producto)

    await expect(mesasModule.getMesas()).resolves.toEqual([mesa])
    await expect(mesasModule.getMesaById('mesa-1')).resolves.toEqual(mesa)
    await expect(mesasModule.crearMesa(1, 4)).resolves.toEqual(mesa)
    await expect(mesasModule.updateEstadoMesa('mesa-1', 'ocupada')).resolves.toBeUndefined()
    await expect(mesasModule.editarMesa('mesa-1', 6)).resolves.toEqual(mesa)
  })

  it('cubre helpers de pedidos y detalle', async () => {
    const pedidosModule = await import('@/lib/supabase/pedidos')
    const detalleModule = await import('@/lib/supabase/detalle')

    const pedido = {
      id: 'pedido-1', mesa_id: 'mesa-1', usuario_id: 'user-1', estado: 'abierto',
      total: 32, comensales: 2, fecha_apertura: '', fecha_cierre: null, created_at: '',
    }

    const pedidoInsertQuery = createQuery({ data: pedido, error: null })
    const duplicateQuery = createQuery({ data: null, error: { code: '23505' } })
    const mesaUpdateErrorQuery = createQuery({ error: { message: 'update failed' } })
    const rollbackDeleteQuery = createQuery({ error: null })
    const pedidoDetalleQuery = createQuery({ data: pedido, error: null })
    const pedidosListQuery = createQuery({ data: [pedido], error: null })
    const cerrarPedidoQuery = createQuery({ error: null })
    const cerrarMesaQuery = createQuery({ error: null })
    const productoActivoQuery = createQuery({ data: { precio: 32, activo: true }, error: null })
    const productoInactivoQuery = createQuery({ data: { precio: 32, activo: false }, error: null })
    const existenteQuery = createQuery({ data: { id: 'detalle-1', cantidad: 1, precio_unitario: 32 }, error: null })
    const detalleUpdateQuery = createQuery({ data: { id: 'detalle-1', cantidad: 2, subtotal: 64 }, error: null })
    const detalleInsertQuery = createQuery({ data: { id: 'detalle-2', cantidad: 1, subtotal: 32 }, error: null })
    const deleteQuery = createQuery({ error: null })

    mockSupabase.from
      .mockImplementationOnce(() => pedidoInsertQuery)
      .mockImplementationOnce(() => createQuery({ error: null }))
    await expect(pedidosModule.crearPedido('mesa-1', 'user-1', 2)).resolves.toEqual(pedido)

    mockSupabase.from.mockImplementationOnce(() => duplicateQuery)
    await expect(pedidosModule.crearPedido('mesa-1', 'user-1', 2)).rejects.toThrow('MESA_OCUPADA')

    mockSupabase.from
      .mockImplementationOnce(() => pedidoInsertQuery)
      .mockImplementationOnce(() => mesaUpdateErrorQuery)
      .mockImplementationOnce(() => rollbackDeleteQuery)
    await expect(pedidosModule.crearPedido('mesa-1', 'user-1', 2)).rejects.toThrow('No se pudo actualizar el estado de la mesa')

    mockSupabase.from.mockImplementationOnce(() => pedidoDetalleQuery)
    await expect(pedidosModule.getPedidoConDetalle('pedido-1')).resolves.toEqual(pedido)

    mockSupabase.from.mockImplementationOnce(() => pedidosListQuery)
    await expect(pedidosModule.getPedidos({ usuarioId: 'user-1', estado: 'abierto', desde: '2026-01-01', hasta: '2026-12-31', esAdmin: false })).resolves.toEqual([pedido])

    mockSupabase.from
      .mockImplementationOnce(() => cerrarPedidoQuery)
      .mockImplementationOnce(() => cerrarMesaQuery)
    await expect(pedidosModule.cerrarPedido('pedido-1', 'mesa-1')).resolves.toBeUndefined()

    mockSupabase.from
      .mockImplementationOnce(() => productoActivoQuery)
      .mockImplementationOnce(() => existenteQuery)
      .mockImplementationOnce(() => detalleUpdateQuery)
    await expect(detalleModule.agregarItem('pedido-1', 'prod-1', 1)).resolves.toEqual({ id: 'detalle-1', cantidad: 2, subtotal: 64 })

    mockSupabase.from
      .mockImplementationOnce(() => productoActivoQuery)
      .mockImplementationOnce(() => createQuery({ data: null, error: null }))
      .mockImplementationOnce(() => detalleInsertQuery)
    await expect(detalleModule.agregarItem('pedido-1', 'prod-1', 1)).resolves.toEqual({ id: 'detalle-2', cantidad: 1, subtotal: 32 })

    mockSupabase.from.mockImplementationOnce(() => productoInactivoQuery)
    await expect(detalleModule.agregarItem('pedido-1', 'prod-1', 1)).rejects.toThrow('Producto inactivo')

    mockSupabase.from
      .mockImplementationOnce(() => createQuery({ data: { precio_unitario: 32 }, error: null }))
      .mockImplementationOnce(() => detalleUpdateQuery)
    await expect(detalleModule.editarItem('detalle-1', 2)).resolves.toEqual({ id: 'detalle-1', cantidad: 2, subtotal: 64 })

    mockSupabase.from.mockImplementationOnce(() => deleteQuery)
    await expect(detalleModule.eliminarItem('detalle-1')).resolves.toBeUndefined()
  })
})
