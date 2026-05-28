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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Pedido</h2>
        {items.length > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">{items.length} ítem{items.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center px-5">
          <span className="text-4xl mb-3">🍽</span>
          <p className="text-slate-500 text-sm font-medium">Sin ítems aún</p>
          <p className="text-slate-400 text-xs mt-1">Agrega productos desde la carta</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.producto.nombre}</p>
                <p className="text-xs text-slate-400 mt-0.5">S/ {Number(item.precio_unitario).toFixed(2)} c/u</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEditar(item.id, item.cantidad - 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold flex items-center justify-center transition-colors"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-bold text-slate-800">{item.cantidad}</span>
                <button
                  onClick={() => onEditar(item.id, item.cantidad + 1)}
                  className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold flex items-center justify-center transition-colors"
                >
                  +
                </button>
                <button
                  onClick={() => onEliminar(item.id)}
                  aria-label="Eliminar"
                  className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 text-sm flex items-center justify-center transition-colors ml-1"
                >
                  ✕
                </button>
              </div>

              <span className="text-sm font-bold text-slate-800 w-16 text-right shrink-0">
                S/ {Number(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 px-5 py-4 bg-slate-50/50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-slate-600">Total</span>
          <span className="text-2xl font-black text-slate-900">S/ {Number(total).toFixed(2)}</span>
        </div>
        <button
          onClick={onCobrar}
          disabled={items.length === 0}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
        >
          💳 Cobrar
        </button>
      </div>
    </div>
  )
}

export default PedidoDetalle
