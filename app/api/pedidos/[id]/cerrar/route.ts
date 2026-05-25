import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cerrarPedido } from '@/lib/supabase/pedidos'

export async function PUT(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/cerrar'>) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: pedido } = await supabase
      .from('pedidos')
      .select('estado, mesa_id, usuario_id')
      .eq('id', id)
      .single()

    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })
    if (pedido.estado === 'cerrado') return NextResponse.json({ error: 'El pedido ya está cerrado', code: 'CONFLICT' }, { status: 409 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin' && pedido.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    // Verificar que tenga al menos un ítem
    const { count } = await supabase
      .from('detalle_pedido')
      .select('id', { count: 'exact', head: true })
      .eq('pedido_id', id)
    if (!count || count === 0) {
      return NextResponse.json({ error: 'El pedido no tiene ítems', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    await cerrarPedido(id, pedido.mesa_id)

    const { data: pedidoCerrado } = await supabase.from('pedidos').select('*').eq('id', id).single()
    return NextResponse.json(pedidoCerrado)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
