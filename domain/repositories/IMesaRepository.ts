import type { Mesa } from '../entities/Mesa'

export interface IMesaRepository {
  findAll(): Promise<Mesa[]>
  findById(id: string): Promise<Mesa | null>
  create(numero: number, capacidad: number): Promise<Mesa>
  updateEstado(id: string, estado: 'libre' | 'ocupada'): Promise<void>
  update(id: string, capacidad: number): Promise<Mesa>
}
