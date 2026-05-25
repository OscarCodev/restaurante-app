'use client'

interface Item {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto: { id: string; nombre: string; categoria: string }
}

interface PedidoDetalleProps {
  items: Item[]
  total: number
  onEditar: (itemId: string, cantidad: number) => void
  onEliminar: (itemId: string) => void
  onCobrar: () => void
}

export function PedidoDetalle({ items, total, onEditar, onEliminar, onCobrar }: PedidoDetalleProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Detalle del pedido</h2>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          No hay ítems
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.producto.nombre}</p>
                <p className="text-xs text-slate-500">S/ {Number(item.precio_unitario).toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditar(item.id, item.cantidad - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-slate-800">{item.cantidad}</span>
                <button
                  onClick={() => onEditar(item.id, item.cantidad + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => onEliminar(item.id)}
                  aria-label="Eliminar"
                  className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 text-sm"
                >
                  ✕
                </button>
              </div>
              <span className="text-sm font-semibold text-slate-800 w-16 text-right">
                S/ {Number(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 mt-4 pt-4">
        <div className="flex justify-between font-semibold text-slate-900 mb-4">
          <span>Total</span>
          <span>S/ {Number(total).toFixed(2)}</span>
        </div>
        <button
          onClick={onCobrar}
          disabled={items.length === 0}
          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
        >
          Cobrar
        </button>
      </div>
    </div>
  )
}

export default PedidoDetalle
