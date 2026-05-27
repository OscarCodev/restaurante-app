import type { IPedidoRepository }   from '@/domain/repositories/IPedidoRepository'
import type { IDetalleRepository }   from '@/domain/repositories/IDetalleRepository'
import { NotFoundError, ConflictError, ValidationError } from '@/domain/errors/DomainErrors'

/**
 * CU — Cancelar pedido vacío
 *
 * Cierra un pedido que NO tiene ítems (p.ej. abierto por error o datos de prueba).
 * Para pedidos con ítems se debe usar CerrarPedido (flujo de cobro).
 *
 * Cualquier mesero puede cancelar su propio pedido; los admin pueden cancelar cualquiera.
 */
export class CancelarPedido {
  constructor(
    private readonly pedidoRepo:  IPedidoRepository,
    private readonly detalleRepo: IDetalleRepository,
  ) {}

  async execute(pedidoId: string, usuarioId: string, esAdmin: boolean): Promise<void> {
    const pedido = await this.pedidoRepo.findById(pedidoId)
    if (!pedido) throw new NotFoundError('Pedido no encontrado')
    if (pedido.estado === 'cerrado') throw new ConflictError('CONFLICT', 'El pedido ya está cerrado')

    // Solo el dueño del pedido o un admin puede cancelarlo
    if (!esAdmin && pedido.usuario_id !== usuarioId) {
      throw new ConflictError('FORBIDDEN', 'No tienes permiso para cancelar este pedido')
    }

    const count = await this.detalleRepo.countByPedido(pedidoId)
    if (count > 0) {
      throw new ValidationError('No se puede cancelar un pedido con ítems. Usa Cobrar para cerrarlo.')
    }

    await this.pedidoRepo.close(pedidoId, pedido.mesa_id)
  }
}
