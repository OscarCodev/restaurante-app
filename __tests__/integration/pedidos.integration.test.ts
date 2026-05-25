import { crearPedido, getPedidoConDetalle, cerrarPedido } from '@/lib/supabase/pedidos'
import { agregarItem } from '@/lib/supabase/detalle'
import { crearMesaTest, crearProductoTest, crearUsuarioTest, limpiarDatosTest, supabaseAdmin } from './setup'

describe('crearPedido — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string

  beforeEach(async () => {
    const [mesa, usuario] = await Promise.all([crearMesaTest(96), crearUsuarioTest()])
    mesaId = mesa.id
    usuarioId = usuario.id
  })

  afterEach(async () => {
    if (pedidoId) {
      await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
      await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    }
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('crea el pedido en estado abierto con total 0', async () => {
    const pedido = await crearPedido(mesaId, usuarioId, 2)
    pedidoId = pedido.id

    expect(pedido.estado).toBe('abierto')
    expect(pedido.total).toBe(0)
    expect(pedido.comensales).toBe(2)
  })

  it('actualiza la mesa a estado ocupada al crear el pedido', async () => {
    const pedido = await crearPedido(mesaId, usuarioId, 3)
    pedidoId = pedido.id

    const { data: mesa } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(mesa?.estado).toBe('ocupada')
  })
})

describe('trigger recalcular_total_pedido', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string
  let productoId: string

  beforeEach(async () => {
    const [mesa, usuario, producto] = await Promise.all([
      crearMesaTest(95),
      crearUsuarioTest(),
      crearProductoTest({ nombre: 'Test producto', precio: 20.00 }),
    ])
    mesaId = mesa.id
    usuarioId = usuario.id
    productoId = producto.id

    const pedido = await crearPedido(mesaId, usuarioId, 1)
    pedidoId = pedido.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('recalcula el total al insertar un ítem', async () => {
    await agregarItem(pedidoId, productoId, 2)

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(40.00)
  })

  it('recalcula el total al agregar múltiples ítems', async () => {
    const producto2 = await crearProductoTest({ nombre: 'Test 2', precio: 15.00 })

    await agregarItem(pedidoId, productoId, 1)
    await agregarItem(pedidoId, producto2.id, 3)

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(65.00)

    await supabaseAdmin.from('productos').delete().eq('id', producto2.id)
  })

  it('recalcula el total a 0 al eliminar todos los ítems', async () => {
    const item = await agregarItem(pedidoId, productoId, 2)
    await supabaseAdmin.from('detalle_pedido').delete().eq('id', item.id)

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(0)
  })
})

describe('cerrarPedido — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string

  beforeEach(async () => {
    const [mesa, usuario] = await Promise.all([crearMesaTest(94), crearUsuarioTest()])
    mesaId = mesa.id
    usuarioId = usuario.id
    const pedido = await crearPedido(mesaId, usuarioId, 2)
    pedidoId = pedido.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('cierra el pedido y registra fecha_cierre', async () => {
    await cerrarPedido(pedidoId, mesaId)

    const { data } = await supabaseAdmin
      .from('pedidos').select('estado, fecha_cierre').eq('id', pedidoId).single()
    expect(data?.estado).toBe('cerrado')
    expect(data?.fecha_cierre).not.toBeNull()
  })

  it('libera la mesa al cerrar el pedido', async () => {
    await cerrarPedido(pedidoId, mesaId)

    const { data } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(data?.estado).toBe('libre')
  })
})
