import { createClient } from './server'

export async function crearPedido(mesaId: string, usuarioId: string, comensales: number) {
  const supabase = await createClient()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({ mesa_id: mesaId, usuario_id: usuarioId, comensales })
    .select()
    .single()
  if (error) {
    // El índice único parcial (idx_one_open_pedido_per_mesa) dispara este código
    if (error.code === '23505') throw new Error('MESA_OCUPADA')
    throw error
  }

  const { error: mesaError } = await supabase
    .from('mesas')
    .update({ estado: 'ocupada' })
    .eq('id', mesaId)

  if (mesaError) {
    // Revertir el pedido si no se pudo actualizar la mesa
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    throw new Error('No se pudo actualizar el estado de la mesa')
  }

  return pedido
}

export async function getPedidoConDetalle(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      mesa:mesas(id, numero),
      items:detalle_pedido(
        *,
        producto:productos(id, nombre, categoria)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getPedidos(filters: { estado?: string; desde?: string; hasta?: string; usuarioId?: string; esAdmin?: boolean }) {
  const supabase = await createClient()
  let query = supabase
    .from('pedidos')
    .select('*, mesa:mesas(id, numero)')
    .order('fecha_apertura', { ascending: false })

  if (!filters.esAdmin && filters.usuarioId) {
    query = query.eq('usuario_id', filters.usuarioId)
  }
  if (filters.estado) query = query.eq('estado', filters.estado)
  if (filters.desde) query = query.gte('fecha_apertura', filters.desde)
  if (filters.hasta) query = query.lte('fecha_apertura', filters.hasta)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function cerrarPedido(id: string, mesaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cerrado', fecha_cierre: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  await supabase.from('mesas').update({ estado: 'libre' }).eq('id', mesaId)
}
