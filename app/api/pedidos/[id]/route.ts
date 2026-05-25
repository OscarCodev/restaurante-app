import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPedidoConDetalle } from '@/lib/supabase/pedidos'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const pedido = await getPedidoConDetalle(id)
    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin' && pedido.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    return NextResponse.json(pedido)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
