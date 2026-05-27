export interface DetallePedido {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
}

export interface DetallePedidoConProducto extends DetallePedido {
  producto: { id: string; nombre: string; categoria: string }
}
