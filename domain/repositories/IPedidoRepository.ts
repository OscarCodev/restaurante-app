import type { Pedido, PedidoConMesa, PedidoConDetalle, PedidoHistorial, PedidoFilters } from '../entities/Pedido'

export interface IPedidoRepository {
  findAll(filters: PedidoFilters): Promise<PedidoConMesa[]>
  findAllAbiertos(): Promise<Pedido[]>
  findAllConDetalle(filters: PedidoFilters): Promise<PedidoHistorial[]>
  findById(id: string): Promise<Pedido | null>
  findConDetalle(id: string): Promise<PedidoConDetalle | null>
  create(mesaId: string, usuarioId: string, comensales: number): Promise<Pedido>
  close(id: string, mesaId: string): Promise<void>
}
