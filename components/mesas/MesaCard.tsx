'use client'
import { useEffect, useState } from 'react'
import type { Mesa } from '@/types/database'

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
  const libre = mesa.estado === 'libre'
  const tiempo = useTimer(libre ? null : mesa.fecha_apertura_pedido)

  const ms = !libre && mesa.fecha_apertura_pedido
    ? Date.now() - new Date(mesa.fecha_apertura_pedido).getTime()
    : 0
  const advertencia = ms > 90 * 60 * 1000

  return (
    <button
      onClick={() => onClick(mesa)}
      className={`w-full rounded-2xl p-5 text-left transition-all shadow-sm border-2 hover:shadow-md active:scale-95 ${
        libre
          ? 'bg-green-50 border-green-400 hover:bg-green-100'
          : advertencia
            ? 'bg-amber-50 border-amber-400 hover:bg-amber-100'
            : 'bg-red-50 border-red-400 hover:bg-red-100'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl font-bold text-slate-800">Mesa {mesa.numero}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          libre
            ? 'bg-green-200 text-green-800'
            : advertencia
              ? 'bg-amber-200 text-amber-800'
              : 'bg-red-200 text-red-800'
        }`}>
          {libre ? 'Libre' : 'Ocupada'}
        </span>
      </div>

      <p className="text-sm text-slate-500">{mesa.capacidad} personas</p>

      {!libre && tiempo && (
        <p className={`text-xl font-mono font-bold mt-2 ${
          advertencia ? 'text-amber-700' : 'text-red-600'
        }`}>
          {tiempo}
        </p>
      )}
    </button>
  )
}

export default MesaCard
