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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Confirmar cobro — Mesa {numeroMesa}</h2>

        <div className="space-y-2 mb-4">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-slate-700">
              <span>{item.producto.nombre} x{item.cantidad}</span>
              <span>S/ {Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-slate-900">
            <span>Total</span>
            <span>S/ {Number(total).toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cobrando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
