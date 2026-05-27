import type { IProductoRepository } from '@/domain/repositories/IProductoRepository'
import type { Producto } from '@/domain/entities/Producto'

export class CrearProducto {
  constructor(private readonly productoRepo: IProductoRepository) {}

  async execute(datos: Omit<Producto, 'id' | 'created_at' | 'activo'>): Promise<Producto> {
    return this.productoRepo.create(datos)
  }
}
