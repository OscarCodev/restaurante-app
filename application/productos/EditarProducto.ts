import type { IProductoRepository } from '@/domain/repositories/IProductoRepository'
import type { Producto } from '@/domain/entities/Producto'
import { NotFoundError } from '@/domain/errors/DomainErrors'

export class EditarProducto {
  constructor(private readonly productoRepo: IProductoRepository) {}

  async execute(id: string, datos: Partial<Producto>): Promise<Producto> {
    const producto = await this.productoRepo.findById(id)
    if (!producto) throw new NotFoundError('Producto no encontrado')
    return this.productoRepo.update(id, datos)
  }
}
