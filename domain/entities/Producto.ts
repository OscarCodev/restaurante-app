export type Categoria = 'entrada' | 'principal' | 'bebida' | 'postre'

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: Categoria
  activo: boolean
  created_at: string
}
