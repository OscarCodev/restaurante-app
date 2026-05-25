'use client'
import { useEffect, useState } from 'react'
import type { Mesa } from '@/types/database'

export default function AdminMesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [numero, setNumero] = useState('')
  const [capacidad, setCapacidad] = useState('')
  const [editando, setEditando] = useState<{ id: string; capacidad: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/mesas')
    if (res.ok) setMesas(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function crearMesa(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: parseInt(numero), capacidad: parseInt(capacidad) }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al crear mesa')
      return
    }
    setNumero('')
    setCapacidad('')
    cargar()
  }

  async function guardarEdicion(id: string) {
    await fetch(`/api/mesas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacidad: parseInt(editando!.capacidad) }),
    })
    setEditando(null)
    cargar()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Gestión de mesas</h2>

      <form onSubmit={crearMesa} className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-base font-medium text-slate-800 mb-4">Nueva mesa</h3>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
            <input
              type="number"
              min="1"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad</label>
            <input
              type="number"
              min="1"
              value={capacidad}
              onChange={e => setCapacidad(e.target.value)}
              required
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 w-24"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Crear
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </form>

      {loading ? (
        <p className="text-slate-500 text-sm">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Mesa</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Capacidad</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-slate-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map(m => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">Mesa {m.numero}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {editando?.id === m.id ? (
                      <input
                        type="number"
                        min="1"
                        value={editando.capacidad}
                        onChange={e => setEditando({ ...editando, capacidad: e.target.value })}
                        className="border rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    ) : (
                      `${m.capacidad} personas`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      m.estado === 'libre' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editando?.id === m.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => guardarEdicion(m.id)} className="text-green-600 hover:text-green-800 text-xs underline">
                          Guardar
                        </button>
                        <button onClick={() => setEditando(null)} className="text-slate-500 hover:text-slate-700 text-xs underline">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditando({ id: m.id, capacidad: m.capacidad.toString() })}
                        className="text-slate-600 hover:text-slate-900 text-xs underline"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
