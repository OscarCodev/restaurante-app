'use client'
import { Fragment, useState } from 'react'

const POR_PAGINA = 10

interface Item {
  id: string
  cantidad: number
  subtotal: number
  producto: { nombre: string }
}

interface Pedido {
  id: string
  total: number
  comensales: number
  fecha_apertura: string
  fecha_cierre: string | null
  mesa: { numero: number }
  items: Item[]
}

interface HistorialTableProps {
  pedidos: Pedido[]
}

function hora(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function HistorialTable({ pedidos }: HistorialTableProps) {
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <p className="text-slate-400 text-sm">No hay pedidos en este rango de fechas</p>
      </div>
    )
  }

  const totalPaginas = Math.ceil(pedidos.length / POR_PAGINA)
  const inicio = (pagina - 1) * POR_PAGINA
  const pagina_actual = pedidos.slice(inicio, inicio + POR_PAGINA)

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mesa</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Apertura</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cierre</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pax</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagina_actual.map(p => (
              <Fragment key={p.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">Mesa {p.mesa.numero}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{hora(p.fecha_apertura)}</td>
                  <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">
                    {p.fecha_cierre ? hora(p.fecha_cierre) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.comensales}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800 font-mono">
                    S/ {Number(p.total).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      {expandido === p.id ? '▲ Ocultar' : '▼ Detalle'}
                    </button>
                  </td>
                </tr>
                {expandido === p.id && (
                  <tr key={`${p.id}-det`} className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={6} className="px-8 py-3">
                      <div className="space-y-1">
                        {p.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs text-slate-600">
                            <span>{item.producto.nombre} <span className="text-slate-400">×{item.cantidad}</span></span>
                            <span className="font-mono font-medium">S/ {Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-400">
            {inicio + 1}–{Math.min(inicio + POR_PAGINA, pedidos.length)} de {pedidos.length} pedidos
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-500">
              {pagina} / {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
