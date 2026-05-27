export type Rol = 'mesero' | 'admin'

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  created_at: string
}
