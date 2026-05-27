import type { IMesaRepository } from '@/domain/repositories/IMesaRepository'
import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { Pedido } from '@/domain/entities/Pedido'
import { NotFoundError, ConflictError, ValidationError } from '@/domain/errors/DomainErrors'

export class CrearPedido {
  constructor(
    private readonly mesaRepo: IMesaRepository,
    private readonly pedidoRepo: IPedidoRepository,
  ) {}

  async execute(mesaId: string, usuarioId: string, comensales: number): Promise<Pedido> {
    const mesa = await this.mesaRepo.findById(mesaId)
    if (!mesa) throw new NotFoundError('Mesa no encontrada')
    if (mesa.estado === 'ocupada') throw new ConflictError('MESA_OCUPADA', 'La mesa ya está ocupada')
    if (comensales > mesa.capacidad) throw new ValidationError('Supera la capacidad de la mesa')

    return this.pedidoRepo.create(mesaId, usuarioId, comensales)
  }
}
