'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase/client'
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
  const [cancelando, setCancelando] = useState(false)
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

  async function handleCancelar() {
    if (!confirm('¿Cancelar este pedido vacío y liberar la mesa?')) return
    setCancelando(true)
    try {
      const res = await fetch(`/api/pedidos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/mesas'
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Error al cancelar el pedido')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setCancelando(false)
    }
  }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 max-w-sm w-full mx-4">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-slate-700 font-medium mb-1">{error || 'Pedido no encontrado'}</p>
          <p className="text-slate-400 text-sm mb-5">No se pudo cargar la información.</p>
          <button
            onClick={() => router.push('/mesas')}
            className="text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            ← Volver a mesas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <a
          href="/mesas"
          className="text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors shrink-0 flex items-center gap-1"
        >
          ← Mesas
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-slate-900 truncate">
            Mesa {pedido.mesa.numero}
            <span className="font-normal text-slate-400"> · {pedido.comensales} persona{pedido.comensales !== 1 ? 's' : ''}</span>
          </h1>
        </div>
        {tiempo && (
          <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
            ⏱ <span className="font-mono font-semibold text-slate-600">{tiempo}</span>
          </span>
        )}
        {pedido.estado === 'abierto' && pedido.items.length === 0 && (
          <button
            onClick={handleCancelar}
            disabled={cancelando}
            className="text-xs text-red-500 hover:text-red-700 font-medium shrink-0 disabled:opacity-50 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            {cancelando ? 'Cancelando…' : 'Cancelar mesa'}
          </button>
        )}
      </header>

      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        <button
          onClick={() => setTabMovil('pedido')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tabMovil === 'pedido'
              ? 'border-b-2 border-slate-900 text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Pedido {pedido.items.length > 0 && <span className="ml-1 text-xs bg-slate-200 text-slate-700 rounded-full px-1.5 py-0.5">{pedido.items.length}</span>}
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
