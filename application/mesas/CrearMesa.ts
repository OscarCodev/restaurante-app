import type { IMesaRepository } from '@/domain/repositories/IMesaRepository'
import type { Mesa } from '@/domain/entities/Mesa'

export class CrearMesa {
  constructor(private readonly mesaRepo: IMesaRepository) {}

  async execute(numero: number, capacidad: number): Promise<Mesa> {
    return this.mesaRepo.create(numero, capacidad)
  }
}
