import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'

export class EliminarItem {
  constructor(private readonly detalleRepo: IDetalleRepository) {}

  async execute(id: string): Promise<void> {
    return this.detalleRepo.delete(id)
  }
}
