'use client'
import { useEffect, useState } from 'react'
import type { Producto } from '@/types/database'
import ProductoForm from '@/components/admin/ProductoForm'
import Drawer from '@/components/ui/Drawer'
import Badge from '@/components/ui/Badge'

const CATEGORIA_VARIANTE: Record<string, 'yellow' | 'blue' | 'cyan' | 'pink'> = {
  entrada:   'yellow',
  principal: 'blue',
  bebida:    'cyan',
  postre:    'pink',
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [editando, setEditando] = useState<Producto | null | 'nuevo'>(null)
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const res = await fetch('/api/productos?todos=true')
    if (res.ok) setProductos(await res.json())
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  async function toggleActivo(producto: Producto) {
    await fetch(`/api/productos/${producto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !producto.activo }),
    })
    setProductos(prev => prev.map(p =>
      p.id === producto.id ? { ...p, activo: !p.activo } : p
    ))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">Productos</h2>
        <button
          onClick={() => setEditando('nuevo')}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 active:scale-95 transition-all"
        >
          + Nuevo producto
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400 text-sm">No hay productos. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productos.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Badge variant={CATEGORIA_VARIANTE[p.categoria] ?? 'gray'}>
                      {p.categoria}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-5 py-3.5 text-slate-700 font-mono">S/ {Number(p.precio).toFixed(2)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActivo(p)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        p.activo
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {p.activo ? '● Activo' : '○ Inactivo'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setEditando(p)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!editando}
        onClose={() => setEditando(null)}
        title={editando === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
      >
        {editando && (
          <ProductoForm
            producto={editando === 'nuevo' ? undefined : editando}
            onSuccess={() => { setEditando(null); cargar() }}
            onCancel={() => setEditando(null)}
          />
        )}
      </Drawer>
    </div>
  )
}
