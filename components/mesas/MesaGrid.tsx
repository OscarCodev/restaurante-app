'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MesaCard, type MesaConPedido } from './MesaCard'
import AbrirPedidoModal from './AbrirPedidoModal'
import type { Mesa } from '@/types/database'

interface MesaGridProps {
  initialMesas: MesaConPedido[]
}

export default function MesaGrid({ initialMesas }: MesaGridProps) {
  const router = useRouter()
  const [mesas, setMesas] = useState<MesaConPedido[]>(initialMesas)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaConPedido | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function aplicarCambioMesa(mesaActualizada: Mesa) {
      if (mesaActualizada.estado === 'ocupada') {
        const { data: pedido } = await supabase
          .from('pedidos')
          .select('id, fecha_apertura')
          .eq('mesa_id', mesaActualizada.id)
          .eq('estado', 'abierto')
          .order('fecha_apertura', { ascending: false })
          .maybeSingle()

        setMesas(prev => prev.map(m =>
          m.id === mesaActualizada.id
            ? {
                ...m,
                ...mesaActualizada,
                pedido_activo_id: pedido?.id ?? null,
                fecha_apertura_pedido: pedido?.fecha_apertura ?? null,
              }
            : m
        ))
      } else {
        setMesas(prev => prev.map(m =>
          m.id === mesaActualizada.id
            ? { ...m, ...mesaActualizada, pedido_activo_id: null, fecha_apertura_pedido: null }
            : m
        ))
      }
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
          { event: 'UPDATE', schema: 'public', table: 'mesas' },
          (payload) => { aplicarCambioMesa(payload.new as Mesa) }
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
    if (mesa.estado === 'ocupada' && mesa.pedido_activo_id) {
      // Navegación completa para evitar que el router cache muestre
      // una versión vieja del pedido sin los ítems ya agregados
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
