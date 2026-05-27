import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { PedidoConDetalle } from '@/domain/entities/Pedido'

export class GetPedidoConDetalle {
  constructor(private readonly pedidoRepo: IPedidoRepository) {}

  async execute(id: string): Promise<PedidoConDetalle | null> {
    return this.pedidoRepo.findConDetalle(id)
  }
}
