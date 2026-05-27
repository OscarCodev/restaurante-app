import { createClient } from '@/infrastructure/supabase/server'
import { ConflictError } from '@/domain/errors/DomainErrors'
import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type {
  Pedido,
  PedidoConMesa,
  PedidoConDetalle,
  PedidoHistorial,
  PedidoFilters,
} from '@/domain/entities/Pedido'

export class SupabasePedidoRepository implements IPedidoRepository {
  async findAll(filters: PedidoFilters): Promise<PedidoConMesa[]> {
    const supabase = await createClient()
    let query = supabase
      .from('pedidos')
      .select('*, mesa:mesas(id, numero)')
      .order('fecha_apertura', { ascending: false })

    if (!filters.esAdmin && filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId)
    }
    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.desde)  query = query.gte('fecha_apertura', filters.desde)
    if (filters.hasta)  query = query.lte('fecha_apertura', filters.hasta)

    const { data, error } = await query
    if (error) throw error
    return data as PedidoConMesa[]
  }

  async findAllAbiertos(): Promise<Pedido[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('estado', 'abierto')
      .order('fecha_apertura', { ascending: false })
    if (error) throw error
    return data
  }

  async findAllConDetalle(filters: PedidoFilters): Promise<PedidoHistorial[]> {
    const supabase = await createClient()
    let query = supabase
      .from('pedidos')
      .select('*, mesa:mesas(numero), items:detalle_pedido(*, producto:productos(nombre))')
      .order('fecha_apertura', { ascending: false })

    if (filters.estado) query = query.eq('estado', filters.estado)
    if (filters.desde)  query = query.gte('fecha_apertura', filters.desde)
    if (filters.hasta)  query = query.lte('fecha_apertura', filters.hasta + 'T23:59:59')
    if (!filters.esAdmin && filters.usuarioId) {
      query = query.eq('usuario_id', filters.usuarioId)
    }

    const { data, error } = await query
    if (error) throw error
    return data as PedidoHistorial[]
  }

  async findById(id: string): Promise<Pedido | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  async findConDetalle(id: string): Promise<PedidoConDetalle | null> {
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
    if (error) return null
    return data as PedidoConDetalle
  }

  async create(mesaId: string, usuarioId: string, comensales: number): Promise<Pedido> {
    const supabase = await createClient()

    const { data: pedido, error } = await supabase
      .from('pedidos')
      .insert({ mesa_id: mesaId, usuario_id: usuarioId, comensales })
      .select()
      .single()

    if (error) {
      // El índice único parcial (idx_one_open_pedido_per_mesa) dispara este código.
      // Cuando ocurre significa que mesas.estado estaba 'libre' pero ya existía un
      // pedido abierto para esa mesa (inconsistencia). Saneamos la BD de paso.
      if (error.code === '23505') {
        await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', mesaId)
        throw new ConflictError('MESA_OCUPADA', 'La mesa ya está ocupada')
      }
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

  async close(id: string, mesaId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'cerrado', fecha_cierre: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    await supabase.from('mesas').update({ estado: 'libre' }).eq('id', mesaId)
  }
}
