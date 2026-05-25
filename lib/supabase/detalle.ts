import { createClient } from './server'

export async function agregarItem(pedidoId: string, productoId: string, cantidad: number) {
  const supabase = await createClient()
  const { data: producto } = await supabase
    .from('productos')
    .select('precio, activo')
    .eq('id', productoId)
    .single()
  if (!producto) throw new Error('Producto no encontrado')
  if (!producto.activo) throw new Error('Producto inactivo')

  // Si el producto ya está en el pedido, incrementa la cantidad
  const { data: existente } = await supabase
    .from('detalle_pedido')
    .select('id, cantidad, precio_unitario')
    .eq('pedido_id', pedidoId)
    .eq('producto_id', productoId)
    .maybeSingle()

  if (existente) {
    const nuevaCantidad = existente.cantidad + cantidad
    const { data, error } = await supabase
      .from('detalle_pedido')
      .update({ cantidad: nuevaCantidad, subtotal: Number(existente.precio_unitario) * nuevaCantidad })
      .eq('id', existente.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const subtotal = Number(producto.precio) * cantidad
  const { data, error } = await supabase
    .from('detalle_pedido')
    .insert({ pedido_id: pedidoId, producto_id: productoId, cantidad, precio_unitario: producto.precio, subtotal })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editarItem(id: string, cantidad: number) {
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('detalle_pedido')
    .select('precio_unitario')
    .eq('id', id)
    .single()
  if (!item) throw new Error('Ítem no encontrado')

  const { data, error } = await supabase
    .from('detalle_pedido')
    .update({ cantidad, subtotal: Number(item.precio_unitario) * cantidad })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('detalle_pedido').delete().eq('id', id)
  if (error) throw error
}
