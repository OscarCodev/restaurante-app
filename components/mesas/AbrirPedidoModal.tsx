'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Mesa } from '@/domain/entities/Mesa'

interface AbrirPedidoModalProps {
  mesa: Mesa
  onClose: () => void
}

export default function AbrirPedidoModal({ mesa, onClose }: AbrirPedidoModalProps) {
  const router = useRouter()
  const [comensales, setComensales] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirmar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_id: mesa.id, comensales }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Error al abrir el pedido')
        setLoading(false)
        return
      }
      router.push(`/mesas/${data.id}`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Abrir pedido</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Mesa {mesa.numero} — capacidad {mesa.capacidad} personas
          </p>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ¿Cuántas personas?
          </label>
          <input
            type="number"
            min={1}
            max={mesa.capacidad}
            value={comensales}
            onChange={e => setComensales(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
          />
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading || comensales < 1 || comensales > mesa.capacidad}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 active:scale-95 transition-all"
          >
            {loading ? 'Abriendo...' : 'Abrir mesa'}
          </button>
        </div>
      </div>
    </div>
  )
}
