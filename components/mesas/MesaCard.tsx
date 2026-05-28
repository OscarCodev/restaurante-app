'use client'
import { useEffect, useState } from 'react'
import type { Mesa } from '@/domain/entities/Mesa'

export type MesaConPedido = Mesa & {
  pedido_activo_id?: string | null
  fecha_apertura_pedido?: string | null
}

interface MesaCardProps {
  mesa: MesaConPedido
  onClick: (mesa: MesaConPedido) => void
}

function tiempoTranscurrido(fechaApertura: string): string {
  const ms = Date.now() - new Date(fechaApertura).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function useTimer(fechaApertura: string | null | undefined): string {
  const [tiempo, setTiempo] = useState(() =>
    fechaApertura ? tiempoTranscurrido(fechaApertura) : ''
  )
  useEffect(() => {
    if (!fechaApertura) { setTiempo(''); return }
    setTiempo(tiempoTranscurrido(fechaApertura))
    const id = setInterval(() => setTiempo(tiempoTranscurrido(fechaApertura)), 60000)
    return () => clearInterval(id)
  }, [fechaApertura])
  return tiempo
}

export function MesaCard({ mesa, onClick }: MesaCardProps) {
  const libre = mesa.estado === 'libre' && !mesa.pedido_activo_id
  const tiempo = useTimer(libre ? null : mesa.fecha_apertura_pedido)

  const ms = !libre && mesa.fecha_apertura_pedido
    ? Date.now() - new Date(mesa.fecha_apertura_pedido).getTime()
    : 0
  const advertencia = ms > 90 * 60 * 1000

  const colorBar = libre
    ? 'bg-emerald-400'
    : advertencia
      ? 'bg-amber-400'
      : 'bg-red-400'

  const cardBorder = libre
    ? 'border-emerald-200 hover:border-emerald-300'
    : advertencia
      ? 'border-amber-200 hover:border-amber-300'
      : 'border-red-200 hover:border-red-300'

  const badgeStyle = libre
    ? 'bg-emerald-100 text-emerald-700'
    : advertencia
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700'

  const timeColor = advertencia ? 'text-amber-600' : 'text-red-500'

  return (
    <button
      onClick={() => onClick(mesa)}
      className={`w-full rounded-2xl text-left transition-all shadow-sm hover:shadow-md active:scale-[0.97] bg-white border ${cardBorder} overflow-hidden group`}
    >
      <div className={`h-1 w-full ${colorBar} transition-all`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-3xl font-black text-slate-800 leading-none">{mesa.numero}</div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-widest mt-0.5">MESA</div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
            {libre ? 'Libre' : 'Ocupada'}
          </span>
        </div>

        <p className="text-xs text-slate-400 font-medium">{mesa.capacidad} personas</p>

        {!libre && tiempo && (
          <div className={`mt-2.5 flex items-center gap-1.5 ${timeColor}`}>
            <span className="text-xs">⏱</span>
            <span className="text-lg font-mono font-bold tracking-tight">{tiempo}</span>
            {advertencia && (
              <span className="text-xs font-semibold text-amber-500 ml-1">!</span>
            )}
          </div>
        )}

        {libre && (
          <div className="mt-2.5 text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Toca para abrir →
          </div>
        )}
      </div>
    </button>
  )
}

export default MesaCard
