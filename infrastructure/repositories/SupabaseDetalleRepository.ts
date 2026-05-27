import { createClient } from '@/infrastructure/supabase/server'
import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'
import type { DetallePedido } from '@/domain/entities/DetallePedido'

export class SupabaseDetalleRepository implements IDetalleRepository {
  async addOrUpdate(
    pedidoId: string,
    productoId: string,
    cantidad: number,
    precio: number,
  ): Promise<DetallePedido> {
    const supabase = await createClient()

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
        .update({
          cantidad: nuevaCantidad,
          subtotal: Number(existente.precio_unitario) * nuevaCantidad,
        })
        .eq('id', existente.id)
        .select()
        .single()
      if (error) throw error
      return data
    }

    const subtotal = precio * cantidad
    const { data, error } = await supabase
      .from('detalle_pedido')
      .insert({
        pedido_id: pedidoId,
        producto_id: productoId,
        cantidad,
        precio_unitario: precio,
        subtotal,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, cantidad: number): Promise<DetallePedido> {
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

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('detalle_pedido')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  async countByPedido(pedidoId: string): Promise<number> {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('detalle_pedido')
      .select('id', { count: 'exact', head: true })
      .eq('pedido_id', pedidoId)
    if (error) throw error
    return count ?? 0
  }
}
