import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { editarItem, eliminarItem } from '@/lib/supabase/detalle'

async function verificarAcceso(supabase: Awaited<ReturnType<typeof createClient>>, pedidoId: string, userId: string) {
  const { data: pedido } = await supabase.from('pedidos').select('estado, usuario_id').eq('id', pedidoId).single()
  if (!pedido) return { error: 'Pedido no encontrado', status: 404, pedido: null }
  if (pedido.estado === 'cerrado') return { error: 'El pedido está cerrado', status: 409, pedido: null }
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', userId).single()
  if (perfil?.rol !== 'admin' && pedido.usuario_id !== userId) return { error: 'Sin permisos', status: 403, pedido: null }
  return { error: null, status: 200, pedido }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items/[itemId]'>) {
  try {
    const { id, itemId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { error, status } = await verificarAcceso(supabase, id, user.id)
    if (error) return NextResponse.json({ error, code: 'ACCESS_ERROR' }, { status })

    const { cantidad } = await request.json()
    if (!cantidad || cantidad < 1) {
      return NextResponse.json({ error: 'Cantidad inválida', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const item = await editarItem(itemId, cantidad)
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items/[itemId]'>) {
  try {
    const { id, itemId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { error, status } = await verificarAcceso(supabase, id, user.id)
    if (error) return NextResponse.json({ error, code: 'ACCESS_ERROR' }, { status })

    await eliminarItem(itemId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
