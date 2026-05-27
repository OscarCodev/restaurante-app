import type { IMesaRepository } from '@/domain/repositories/IMesaRepository'
import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { Mesa } from '@/domain/entities/Mesa'

export interface MesaConEstado extends Mesa {
  pedido_activo_id: string | null
  fecha_apertura_pedido: string | null
}

export class GetMesasConEstado {
  constructor(
    private readonly mesaRepo: IMesaRepository,
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(): Promise<MesaConEstado[]> {
    const [mesas, abiertos] = await Promise.all([
      this.mesaRepo.findAll(),
      this.pedidoRepo.findAllAbiertos(),
    ])

    return mesas.map(m => {
      const pedido = abiertos.find(p => p.mesa_id === m.id)
      return {
        ...m,
        pedido_activo_id: pedido?.id ?? null,
        fecha_apertura_pedido: pedido?.fecha_apertura ?? null,
      }
    })
  }
}
