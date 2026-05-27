import type { IProductoRepository } from '@/domain/repositories/IProductoRepository'
import type { Producto } from '@/domain/entities/Producto'

export class GetProductos {
  constructor(private readonly productoRepo: IProductoRepository) {}

  async execute(soloActivos = true): Promise<Producto[]> {
    return this.productoRepo.findAll(soloActivos)
  }
}
