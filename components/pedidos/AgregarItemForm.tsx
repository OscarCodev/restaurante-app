'use client'
import { useEffect, useState } from 'react'
import type { Producto } from '@/domain/entities/Producto'
import type { Categoria } from '@/domain/entities/Producto'

const CATEGORIAS: { value: Categoria | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'principal', label: 'Principales' },
  { value: 'bebida', label: 'Bebidas' },
  { value: 'postre', label: 'Postres' },
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
      setTimeout(() => setConfirmado(null), 1200)
      onItemAdded()
    } catch {
      setErrorMsg('Error de conexión')
    } finally {
      setAgregando(null)
    }
  }

  if (cerrado) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-slate-500 text-sm text-center">El pedido está cerrado</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Carta</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {CATEGORIAS.map(c => (
          <button
            key={c.value}
            onClick={() => setCategoria(c.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoria === c.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Cargando carta...</p>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {filtrados.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                {p.descripcion && <p className="text-xs text-slate-400">{p.descripcion}</p>}
              </div>
              <div className="flex items-center gap-3 ml-3">
                <span className="text-sm font-semibold text-slate-700">S/ {Number(p.precio).toFixed(2)}</span>
                <button
                  onClick={() => agregar(p.id)}
                  disabled={agregando === p.id}
                  className={`w-7 h-7 rounded-lg text-white text-lg font-bold flex items-center justify-center transition-colors ${
                    confirmado === p.id
                      ? 'bg-green-600'
                      : 'bg-slate-900 hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  {confirmado === p.id ? '✓' : '+'}
                </button>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">Sin productos en esta categoría</p>
          )}
        </div>
      )}
    </div>
  )
}
