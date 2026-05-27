import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'
import type { PedidoConDetalle } from '@/domain/entities/Pedido'
import { NotFoundError, ConflictError, ValidationError } from '@/domain/errors/DomainErrors'

export class CerrarPedido {
  constructor(
    private readonly pedidoRepo: IPedidoRepository,
    private readonly detalleRepo: IDetalleRepository,
  ) {}

  async execute(pedidoId: string): Promise<PedidoConDetalle | null> {
    const pedido = await this.pedidoRepo.findById(pedidoId)
    if (!pedido) throw new NotFoundError('Pedido no encontrado')
    if (pedido.estado === 'cerrado') throw new ConflictError('CONFLICT', 'El pedido ya está cerrado')

    const count = await this.detalleRepo.countByPedido(pedidoId)
    if (count === 0) throw new ValidationError('El pedido no tiene ítems')

    await this.pedidoRepo.close(pedidoId, pedido.mesa_id)
    return this.pedidoRepo.findConDetalle(pedidoId)
  }
}
