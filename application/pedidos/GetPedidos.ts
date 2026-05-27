import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { PedidoConMesa, PedidoFilters } from '@/domain/entities/Pedido'

export class GetPedidos {
  constructor(private readonly pedidoRepo: IPedidoRepository) {}

  async execute(filters: PedidoFilters): Promise<PedidoConMesa[]> {
    return this.pedidoRepo.findAll(filters)
  }
}
