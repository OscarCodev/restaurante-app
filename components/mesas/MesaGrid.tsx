'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/infrastructure/supabase/client'
import { MesaCard, type MesaConPedido } from './MesaCard'
import AbrirPedidoModal from './AbrirPedidoModal'

interface MesaGridProps {
  initialMesas: MesaConPedido[]
}

export default function MesaGrid({ initialMesas }: MesaGridProps) {
  const [mesas, setMesas] = useState<MesaConPedido[]>(initialMesas)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConPedido | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function recargarMesas() {
      const res = await fetch('/api/mesas')
      if (res.ok) setMesas(await res.json())
    }

    async function iniciarRealtime() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // @supabase/ssr no pasa el JWT al WebSocket automáticamente;
      // hay que setearlo explícitamente para que RLS funcione en Realtime
      supabase.realtime.setAuth(session.access_token)

      const channel = supabase
        .channel(`mesas-realtime-${session.user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mesas' },
          recargarMesas
        )
        .subscribe()

      return channel
    }

    const channelPromise = iniciarRealtime()

    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel)
      })
    }
  }, [])

  function handleMesaClick(mesa: MesaConPedido) {
    if (mesa.pedido_activo_id) {
      // Si hay un pedido activo (sea cual sea mesas.estado), navegar al pedido.
      // Esto también cubre inconsistencias donde mesas.estado='libre' pero
      // existe un pedido abierto en la BD (datos sucios de desarrollo, etc.).
      window.location.href = `/mesas/${mesa.pedido_activo_id}`
    } else if (mesa.estado === 'libre') {
      setMesaSeleccionada(mesa)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mesas.map(mesa => (
          <MesaCard
            key={mesa.id}
            mesa={mesa}
            onClick={handleMesaClick}
          />
        ))}
      </div>
      {mesaSeleccionada && (
        <AbrirPedidoModal
          mesa={mesaSeleccionada}
          onClose={() => setMesaSeleccionada(null)}
        />
      )}
    </>
  )
}
