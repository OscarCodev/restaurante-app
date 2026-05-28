'use client'
import { useEffect, useState } from 'react'
import type { Producto } from '@/domain/entities/Producto'
import type { Categoria } from '@/domain/entities/Producto'

const CATEGORIAS: { value: Categoria | 'todos'; label: string; emoji: string }[] = [
  { value: 'todos',     label: 'Todos',      emoji: '🍽' },
  { value: 'entrada',   label: 'Entradas',   emoji: '🥗' },
  { value: 'principal', label: 'Principales', emoji: '🍖' },
  { value: 'bebida',    label: 'Bebidas',    emoji: '🥤' },
  { value: 'postre',    label: 'Postres',    emoji: '🍮' },
]

interface AgregarItemFormProps {
  pedidoId: string
  cerrado: boolean
  onItemAdded: () => void
}

export default function AgregarItemForm({ pedidoId, cerrado, onItemAdded }: AgregarItemFormProps) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categoria, setCategoria] = useState<Categoria | 'todos'>('todos')
  const [loading, setLoading] = useState(true)
  const [agregando, setAgregando] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/productos')
      .then(r => r.json())
      .then(setProductos)
      .finally(() => setLoading(false))
  }, [])

  const filtrados = categoria === 'todos'
    ? productos
    : productos.filter(p => p.categoria === categoria)

  async function agregar(productoId: string) {
    setAgregando(productoId)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productoId, cantidad: 1 }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body.error ?? 'Error al agregar ítem')
        return
      }
      setConfirmado(productoId)
      setTimeout(() => setConfirmado(null), 1000)
      onItemAdded()
    } catch {
      setErrorMsg('Error de conexión')
    } finally {
      setAgregando(null)
    }
  }

  if (cerrado) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <span className="text-3xl mb-3 block">🔒</span>
        <p className="text-slate-500 text-sm font-medium">El pedido está cerrado</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Carta</h2>
      </div>

      <div className="px-4 py-3 flex gap-1.5 flex-wrap border-b border-slate-100 bg-slate-50/60">
        {CATEGORIAS.map(c => (
          <button
            key={c.value}
            onClick={() => setCategoria(c.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoria === c.value
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mx-4 mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtrados.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                {p.descripcion && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{p.descripcion}</p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <span className="text-sm font-bold text-slate-700">S/ {Number(p.precio).toFixed(2)}</span>
                <button
                  onClick={() => agregar(p.id)}
                  disabled={agregando === p.id}
                  className={`w-8 h-8 rounded-xl text-white text-base font-bold flex items-center justify-center transition-all shadow-sm active:scale-[0.92] ${
                    confirmado === p.id
                      ? 'bg-emerald-500 scale-95'
                      : 'bg-slate-900 hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  {confirmado === p.id ? '✓' : '+'}
                </button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-slate-400 text-sm">Sin productos en esta categoría</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
