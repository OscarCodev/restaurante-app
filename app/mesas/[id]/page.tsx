'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PedidoDetalle } from '@/components/pedidos/PedidoDetalle'
import AgregarItemForm from '@/components/pedidos/AgregarItemForm'
import CobrarModal from '@/components/pedidos/CobrarModal'

interface Pedido {
  id: string
  estado: 'abierto' | 'cerrado'
  total: number
  comensales: number
  fecha_apertura: string
  mesa: { id: string; numero: number }
  items: Array<{
    id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    producto: { id: string; nombre: string; categoria: string }
  }>
}

function tiempoTranscurrido(fechaApertura: string): string {
  const ms = Date.now() - new Date(fechaApertura).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function useTimer(fechaApertura: string | undefined): string {
  const [tiempo, setTiempo] = useState(() => fechaApertura ? tiempoTranscurrido(fechaApertura) : '')
  useEffect(() => {
    if (!fechaApertura) return
    setTiempo(tiempoTranscurrido(fechaApertura))
    const id = setInterval(() => setTiempo(tiempoTranscurrido(fechaApertura)), 60000)
    return () => clearInterval(id)
  }, [fechaApertura])
  return tiempo
}

export default function DetallePedidoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cobrando, setCobrando] = useState(false)
  const [tabMovil, setTabMovil] = useState<'pedido' | 'carta'>('pedido')

  const tiempo = useTimer(pedido?.fecha_apertura)

  const cargarPedido = useCallback(async () => {
    try {
      const res = await fetch(`/api/pedidos/${id}`)
      if (res.status === 401) { router.push('/login'); return }
      if (res.status === 404) { setError('Pedido no encontrado'); setLoading(false); return }
      if (!res.ok) { setError('Error al cargar el pedido'); setLoading(false); return }
      setPedido(await res.json())
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { cargarPedido() }, [cargarPedido])

  useEffect(() => {
    const supabase = createClient()

    async function suscribir() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      supabase.realtime.setAuth(session.access_token)

      const channel = supabase
        .channel(`pedido-items-${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'detalle_pedido', filter: `pedido_id=eq.${id}` },
          () => { cargarPedido() }
        )
        .subscribe()

      return channel
    }

    const channelPromise = suscribir()
    return () => {
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel)
      })
    }
  }, [id, cargarPedido])

  async function handleEliminar(itemId: string) {
    await fetch(`/api/pedidos/${id}/items/${itemId}`, { method: 'DELETE' })
    cargarPedido()
  }

  async function handleEditar(itemId: string, cantidad: number) {
    if (cantidad < 1) { handleEliminar(itemId); return }
    await fetch(`/api/pedidos/${id}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad }),
    })
    cargarPedido()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando pedido...</p>
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Pedido no encontrado'}</p>
          <button onClick={() => router.push('/mesas')} className="text-slate-600 underline text-sm">
            Volver a mesas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <a
          href="/mesas"
          className="text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors shrink-0"
        >
          ← Volver
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-900 truncate">
            Mesa {pedido.mesa.numero}
            <span className="font-normal text-slate-500"> · {pedido.comensales} persona{pedido.comensales !== 1 ? 's' : ''}</span>
          </h1>
        </div>
        {tiempo && (
          <span className="text-xs text-slate-400 shrink-0">
            Abierto hace <span className="font-mono font-semibold text-slate-600">{tiempo}</span>
          </span>
        )}
      </header>

      {/* Tabs para móvil */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setTabMovil('pedido')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tabMovil === 'pedido'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Pedido
        </button>
        <button
          onClick={() => setTabMovil('carta')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tabMovil === 'carta'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Carta
        </button>
      </div>

      <main className="p-4 lg:p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className={tabMovil === 'pedido' ? 'block' : 'hidden lg:block'}>
            <PedidoDetalle
              items={pedido.items}
              total={pedido.total}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onCobrar={() => setCobrando(true)}
            />
          </div>
          <div className={tabMovil === 'carta' ? 'block' : 'hidden lg:block'}>
            <AgregarItemForm
              pedidoId={pedido.id}
              cerrado={pedido.estado === 'cerrado'}
              onItemAdded={cargarPedido}
            />
          </div>
        </div>
      </main>

      {cobrando && (
        <CobrarModal
          pedidoId={pedido.id}
          numeroMesa={pedido.mesa.numero}
          items={pedido.items}
          total={pedido.total}
          onClose={() => setCobrando(false)}
        />
      )}
    </div>
  )
}
