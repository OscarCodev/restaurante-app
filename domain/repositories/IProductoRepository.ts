import type { Producto } from '../entities/Producto'

export interface IProductoRepository {
  findAll(soloActivos?: boolean): Promise<Producto[]>
  findById(id: string): Promise<Producto | null>
  create(datos: Omit<Producto, 'id' | 'created_at' | 'activo'>): Promise<Producto>
  update(id: string, datos: Partial<Producto>): Promise<Producto>
}
