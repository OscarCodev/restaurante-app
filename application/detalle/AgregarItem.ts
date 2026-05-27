import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'
import type { IProductoRepository } from '@/domain/repositories/IProductoRepository'
import type { DetallePedido } from '@/domain/entities/DetallePedido'
import { NotFoundError, ValidationError } from '@/domain/errors/DomainErrors'

export class AgregarItem {
  constructor(
    private readonly detalleRepo: IDetalleRepository,
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(pedidoId: string, productoId: string, cantidad: number): Promise<DetallePedido> {
    const producto = await this.productoRepo.findById(productoId)
    if (!producto) throw new NotFoundError('Producto no encontrado')
    if (!producto.activo) throw new ValidationError('Producto inactivo')

    return this.detalleRepo.addOrUpdate(pedidoId, productoId, cantidad, Number(producto.precio))
  }
}
