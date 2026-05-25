import { agregarItem, editarItem, eliminarItem } from '@/lib/supabase/detalle'
import { crearMesaTest, crearProductoTest, crearUsuarioTest, limpiarDatosTest, supabaseAdmin } from './setup'
import { crearPedido } from '@/lib/supabase/pedidos'

describe('agregarItem — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string
  let productoId: string

  beforeEach(async () => {
    const [mesa, usuario, producto] = await Promise.all([
      crearMesaTest(91),
      crearUsuarioTest(),
      crearProductoTest({ nombre: 'Test detalle', precio: 20.00 }),
    ])
    mesaId = mesa.id
    usuarioId = usuario.id
    productoId = producto.id
    const pedido = await crearPedido(mesaId, usuarioId, 2)
    pedidoId = pedido.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('inserta un nuevo ítem con precio_unitario y subtotal correctos', async () => {
    const item = await agregarItem(pedidoId, productoId, 3)

    expect(item.pedido_id).toBe(pedidoId)
    expect(item.producto_id).toBe(productoId)
    expect(item.cantidad).toBe(3)
    expect(Number(item.precio_unitario)).toBe(20.00)
    expect(Number(item.subtotal)).toBe(60.00)
  })

  it('incrementa la cantidad si el producto ya está en el pedido', async () => {
    await agregarItem(pedidoId, productoId, 1)
    const item = await agregarItem(pedidoId, productoId, 2)

    expect(item.cantidad).toBe(3)
    expect(Number(item.subtotal)).toBe(60.00)
  })

  it('lanza error si el producto no existe', async () => {
    await expect(
      agregarItem(pedidoId, '00000000-0000-0000-0000-000000000000', 1)
    ).rejects.toThrow('Producto no encontrado')
  })

  it('lanza error si el producto está inactivo', async () => {
    await supabaseAdmin.from('productos').update({ activo: false }).eq('id', productoId)
    await expect(agregarItem(pedidoId, productoId, 1)).rejects.toThrow('Producto inactivo')
  })
})

describe('editarItem — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string
  let productoId: string
  let itemId: string

  beforeEach(async () => {
    const [mesa, usuario, producto] = await Promise.all([
      crearMesaTest(90),
      crearUsuarioTest(),
      crearProductoTest({ nombre: 'Test editar item', precio: 15.00 }),
    ])
    mesaId = mesa.id
    usuarioId = usuario.id
    productoId = producto.id
    const pedido = await crearPedido(mesaId, usuarioId, 1)
    pedidoId = pedido.id
    const item = await agregarItem(pedidoId, productoId, 2)
    itemId = item.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('actualiza la cantidad y recalcula el subtotal', async () => {
    const actualizado = await editarItem(itemId, 5)

    expect(actualizado.cantidad).toBe(5)
    expect(Number(actualizado.subtotal)).toBe(75.00)
  })

  it('lanza error si el ítem no existe', async () => {
    await expect(
      editarItem('00000000-0000-0000-0000-000000000000', 3)
    ).rejects.toThrow('Ítem no encontrado')
  })
})

describe('eliminarItem — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string
  let productoId: string
  let itemId: string

  beforeEach(async () => {
    const [mesa, usuario, producto] = await Promise.all([
      crearMesaTest(89),
      crearUsuarioTest(),
      crearProductoTest({ nombre: 'Test eliminar item', precio: 10.00 }),
    ])
    mesaId = mesa.id
    usuarioId = usuario.id
    productoId = producto.id
    const pedido = await crearPedido(mesaId, usuarioId, 1)
    pedidoId = pedido.id
    const item = await agregarItem(pedidoId, productoId, 1)
    itemId = item.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('elimina el ítem correctamente', async () => {
    await eliminarItem(itemId)

    const { data } = await supabaseAdmin
      .from('detalle_pedido')
      .select('id')
      .eq('id', itemId)
      .maybeSingle()
    expect(data).toBeNull()
  })

  it('el total del pedido vuelve a 0 tras eliminar el único ítem', async () => {
    await eliminarItem(itemId)

    const { data } = await supabaseAdmin
      .from('pedidos')
      .select('total')
      .eq('id', pedidoId)
      .single()
    expect(Number(data?.total)).toBe(0)
  })
})
