import { createClient } from '@/infrastructure/supabase/server'
import type { IMesaRepository } from '@/domain/repositories/IMesaRepository'
import type { Mesa } from '@/domain/entities/Mesa'

export class SupabaseMesaRepository implements IMesaRepository {
  async findAll(): Promise<Mesa[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .order('numero')
    if (error) throw error
    return data
  }

  async findById(id: string): Promise<Mesa | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mesas')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  async create(numero: number, capacidad: number): Promise<Mesa> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mesas')
      .insert({ numero, capacidad })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateEstado(id: string, estado: 'libre' | 'ocupada'): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('mesas')
      .update({ estado })
      .eq('id', id)
    if (error) throw error
  }

  async update(id: string, capacidad: number): Promise<Mesa> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mesas')
      .update({ capacidad })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
