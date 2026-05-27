import { SupabaseMesaRepository }     from '@/infrastructure/repositories/SupabaseMesaRepository'
import { SupabaseProductoRepository } from '@/infrastructure/repositories/SupabaseProductoRepository'
import { SupabasePedidoRepository }   from '@/infrastructure/repositories/SupabasePedidoRepository'
import { SupabaseDetalleRepository }  from '@/infrastructure/repositories/SupabaseDetalleRepository'

import { GetMesasConEstado }  from '@/application/mesas/GetMesasConEstado'
import { CrearMesa }          from '@/application/mesas/CrearMesa'
import { EditarMesa }         from '@/application/mesas/EditarMesa'

import { GetProductos }       from '@/application/productos/GetProductos'
import { CrearProducto }      from '@/application/productos/CrearProducto'
import { EditarProducto }     from '@/application/productos/EditarProducto'

import { GetPedidos }          from '@/application/pedidos/GetPedidos'
import { GetPedidoConDetalle } from '@/application/pedidos/GetPedidoConDetalle'
import { GetHistorial }        from '@/application/pedidos/GetHistorial'
import { CrearPedido }         from '@/application/pedidos/CrearPedido'
import { CerrarPedido }        from '@/application/pedidos/CerrarPedido'
import { CancelarPedido }      from '@/application/pedidos/CancelarPedido'

import { AgregarItem }  from '@/application/detalle/AgregarItem'
import { EditarItem }   from '@/application/detalle/EditarItem'
import { EliminarItem } from '@/application/detalle/EliminarItem'

export function createContainer() {
  // ── Repositories ──────────────────────────────────────────────────────────
  const mesaRepo     = new SupabaseMesaRepository()
  const productoRepo = new SupabaseProductoRepository()
  const pedidoRepo   = new SupabasePedidoRepository()
  const detalleRepo  = new SupabaseDetalleRepository()

  // ── Use Cases ─────────────────────────────────────────────────────────────
  return {
    // Mesas
    getMesasConEstado: new GetMesasConEstado(mesaRepo, pedidoRepo),
    crearMesa:         new CrearMesa(mesaRepo),
    editarMesa:        new EditarMesa(mesaRepo),

    // Productos
    getProductos:  new GetProductos(productoRepo),
    crearProducto: new CrearProducto(productoRepo),
    editarProducto: new EditarProducto(productoRepo),

    // Pedidos
    getPedidos:          new GetPedidos(pedidoRepo),
    getPedidoConDetalle: new GetPedidoConDetalle(pedidoRepo),
    getHistorial:        new GetHistorial(pedidoRepo),
    crearPedido:         new CrearPedido(mesaRepo, pedidoRepo),
    cerrarPedido:        new CerrarPedido(pedidoRepo, detalleRepo),
    cancelarPedido:      new CancelarPedido(pedidoRepo, detalleRepo),

    // Detalle
    agregarItem:  new AgregarItem(detalleRepo, productoRepo),
    editarItem:   new EditarItem(detalleRepo),
    eliminarItem: new EliminarItem(detalleRepo),
  }
}
