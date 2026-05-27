import type { IMesaRepository } from '@/domain/repositories/IMesaRepository'
import type { Mesa } from '@/domain/entities/Mesa'
import { NotFoundError } from '@/domain/errors/DomainErrors'

export class EditarMesa {
  constructor(private readonly mesaRepo: IMesaRepository) {}

  async execute(id: string, capacidad: number): Promise<Mesa> {
    const mesa = await this.mesaRepo.findById(id)
    if (!mesa) throw new NotFoundError('Mesa no encontrada')
    return this.mesaRepo.update(id, capacidad)
  }
}
