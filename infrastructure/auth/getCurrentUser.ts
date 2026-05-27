import { createClient } from '@/infrastructure/supabase/server'

export interface AuthUser {
  id: string
  rol: 'admin' | 'mesero'
  nombre: string
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  if (!perfil) return null

  return {
    id: user.id,
    rol: perfil.rol as 'admin' | 'mesero',
    nombre: perfil.nombre,
  }
}
