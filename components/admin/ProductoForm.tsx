'use client'
import { useState } from 'react'
import type { Producto, Categoria } from '@/types/database'

interface ProductoFormProps {
  producto?: Producto
  onSuccess: () => void
  onCancel: () => void
}

const CATEGORIAS: Categoria[] = ['entrada', 'principal', 'bebida', 'postre']

export default function ProductoForm({ producto, onSuccess, onCancel }: ProductoFormProps) {
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '')
  const [categoria, setCategoria] = useState<Categoria>(producto?.categoria ?? 'principal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const body = {
      nombre,
      descripcion: descripcion || undefined,
      precio: parseFloat(precio),
      categoria,
    }

    const url = producto ? `/api/productos/${producto.id}` : '/api/productos'
    const method = producto ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        setLoading(false)
        return
      }
      onSuccess()
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
        <input
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Precio (S/)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value as Categoria)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {CATEGORIAS.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-700 transition-colors"
        >
          {loading ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
