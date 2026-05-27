import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'
import type { DetallePedido } from '@/domain/entities/DetallePedido'

export class EditarItem {
  constructor(private readonly detalleRepo: IDetalleRepository) {}

  async execute(id: string, cantidad: number): Promise<DetallePedido> {
    return this.detalleRepo.update(id, cantidad)
  }
}
