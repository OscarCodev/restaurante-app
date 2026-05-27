export type EstadoMesa = 'libre' | 'ocupada'

export interface Mesa {
  id: string
  numero: number
  capacidad: number
  estado: EstadoMesa
  created_at: string
}
