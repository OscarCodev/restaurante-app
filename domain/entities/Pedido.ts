import type { DetallePedidoConProducto } from './DetallePedido'

export type EstadoPedido = 'abierto' | 'cerrado'

export interface Pedido {
  id: string
  mesa_id: string
  usuario_id: string
  estado: EstadoPedido
  total: number
  comensales: number
  fecha_apertura: string
  fecha_cierre: string | null
  created_at: string
}

export interface PedidoConMesa extends Pedido {
  mesa: { id: string; numero: number }
}

export interface PedidoConDetalle extends Pedido {
  mesa: { id: string; numero: number }
  items: DetallePedidoConProducto[]
}

export interface PedidoHistorial extends Pedido {
  mesa: { numero: number }
  items: Array<{
    id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    producto: { nombre: string }
  }>
}

export interface PedidoFilters {
  estado?: string
  desde?: string
  hasta?: string
  usuarioId?: string
  esAdmin?: boolean
}
