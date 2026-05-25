import { createClient } from './server'
import type { Mesa } from '@/types/database'

export async function getMesas(): Promise<Mesa[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero')
  if (error) throw error
  return data
}

export async function getMesaById(id: string): Promise<Mesa | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function crearMesa(numero: number, capacidad: number): Promise<Mesa> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mesas')
    .insert({ numero, capacidad })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEstadoMesa(id: string, estado: 'libre' | 'ocupada') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mesas')
    .update({ estado })
    .eq('id', id)
  if (error) throw error
}

export async function editarMesa(id: string, capacidad: number): Promise<Mesa> {
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
