import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { PedidoHistorial } from '@/domain/entities/Pedido'

export class GetHistorial {
  constructor(private readonly pedidoRepo: IPedidoRepository) {}

  async execute(desde: string, hasta: string): Promise<PedidoHistorial[]> {
    return this.pedidoRepo.findAllConDetalle({
      estado: 'cerrado',
      desde,
      hasta,
      esAdmin: true,
    })
  }
}
