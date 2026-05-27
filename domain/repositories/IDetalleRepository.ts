import type { DetallePedido } from '../entities/DetallePedido'

export interface IDetalleRepository {
  addOrUpdate(pedidoId: string, productoId: string, cantidad: number, precio: number): Promise<DetallePedido>
  update(id: string, cantidad: number): Promise<DetallePedido>
  delete(id: string): Promise<void>
  countByPedido(pedidoId: string): Promise<number>
}
