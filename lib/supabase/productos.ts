import { createClient } from './server'
import type { Producto } from '@/types/database'

export async function getProductos(soloActivos = true): Promise<Producto[]> {
  const supabase = await createClient()
  let query = supabase.from('productos').select('*').order('categoria').order('nombre')
  if (soloActivos) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProductoById(id: string): Promise<Producto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function crearProducto(datos: Omit<Producto, 'id' | 'created_at' | 'activo'>): Promise<Producto> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').insert(datos).select().single()
  if (error) throw error
  return data
}

export async function editarProducto(id: string, datos: Partial<Producto>): Promise<Producto> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').update(datos).eq('id', id).select().single()
  if (error) throw error
  return data
}
