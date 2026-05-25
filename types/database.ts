export type Rol = 'mesero' | 'admin'
export type EstadoMesa = 'libre' | 'ocupada'
export type EstadoPedido = 'abierto' | 'cerrado'
export type Categoria = 'entrada' | 'principal' | 'bebida' | 'postre'

export interface Mesa {
  id: string
  numero: number
  capacidad: number
  estado: EstadoMesa
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: Categoria
  activo: boolean
  created_at: string
}

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

export interface DetallePedido {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
}

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  created_at: string
}
