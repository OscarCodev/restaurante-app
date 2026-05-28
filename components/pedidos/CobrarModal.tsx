'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Item {
  id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto: { nombre: string; categoria: string }
}

interface CobrarModalProps {
  pedidoId: string
  numeroMesa: number
  items: Item[]
  total: number
  onClose: () => void
}

export default function CobrarModal({ pedidoId, numeroMesa, items, total, onClose }: CobrarModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirmar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/cerrar`, { method: 'PUT' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al cobrar')
        setLoading(false)
        return
      }
      router.push('/mesas')
      router.refresh()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-[fade-in_0.15s_ease]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[slide-up_0.2s_ease]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cobro</p>
              <h2 className="text-lg font-bold mt-0.5">Mesa {numeroMesa}</h2>
            </div>
            <span className="text-3xl">💳</span>
          </div>
        </div>

        {/* Ticket / Items */}
        <div className="px-6 py-4 border-b border-dashed border-slate-200">
          <div className="space-y-2.5">
            {items.map(item => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div className="flex-1 min-w-0 mr-3">
                  <span className="text-slate-800 font-medium">{item.producto.nombre}</span>
                  <span className="text-slate-400 ml-1.5">×{item.cantidad}</span>
                </div>
                <span className="text-slate-700 font-semibold shrink-0">
                  S/ {Number(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-500">Total a cobrar</span>
            <span className="text-2xl font-black text-slate-900">S/ {Number(total).toFixed(2)}</span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <span>⚠</span> {error}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cobrando...
              </span>
            ) : 'Confirmar cobro'}
          </button>
        </div>
      </div>
    </div>
  )
}
