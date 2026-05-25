import { createClient } from '@/lib/supabase/server'
import HistorialTable from '@/components/admin/HistorialTable'

interface SearchParams {
  desde?: string
  hasta?: string
}

export default async function HistorialPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const hoy = new Date().toISOString().split('T')[0]
  const desde = sp.desde ?? hoy
  const hasta = sp.hasta ?? hoy

  const supabase = await createClient()
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*, mesa:mesas(numero), items:detalle_pedido(*, producto:productos(nombre))')
    .eq('estado', 'cerrado')
    .gte('fecha_apertura', desde)
    .lte('fecha_apertura', hasta + 'T23:59:59')
    .order('fecha_apertura', { ascending: false })

  const totalDia = (pedidos ?? []).reduce((sum, p) => sum + Number(p.total), 0)

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Historial de pedidos</h2>

      <form className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={desde}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={hasta}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <p className="text-sm text-slate-500">Total recaudado</p>
        <p className="text-3xl font-bold text-slate-900">S/ {totalDia.toFixed(2)}</p>
        <p className="text-xs text-slate-400 mt-1">{(pedidos ?? []).length} pedido{(pedidos ?? []).length !== 1 ? 's' : ''}</p>
      </div>

      <HistorialTable pedidos={pedidos ?? []} />
    </div>
  )
}
