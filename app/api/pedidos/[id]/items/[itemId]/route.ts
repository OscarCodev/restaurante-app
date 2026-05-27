import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { createClient } from '@/infrastructure/supabase/server'

async function verificarAcceso(pedidoId: string, userId: string, esAdmin: boolean) {
  const supabase = await createClient()
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('estado, usuario_id')
    .eq('id', pedidoId)
    .single()
  if (!pedido) return { error: 'Pedido no encontrado', status: 404 }
  if (pedido.estado === 'cerrado') return { error: 'El pedido está cerrado', status: 409 }
  if (!esAdmin && pedido.usuario_id !== userId) return { error: 'Sin permisos', status: 403 }
  return { error: null, status: 200 }
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items/[itemId]'>) {
  try {
    const { id, itemId } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { error, status } = await verificarAcceso(id, user.id, user.rol === 'admin')
    if (error) return NextResponse.json({ error, code: 'ACCESS_ERROR' }, { status })

    const { cantidad } = await request.json()
    if (!cantidad || cantidad < 1) {
      return NextResponse.json({ error: 'Cantidad inválida', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const item = await createContainer().editarItem.execute(itemId, cantidad)
    return NextResponse.json(item)
  } catch (err) {
    return mapDomainError(err)
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items/[itemId]'>) {
  try {
    const { id, itemId } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { error, status } = await verificarAcceso(id, user.id, user.rol === 'admin')
    if (error) return NextResponse.json({ error, code: 'ACCESS_ERROR' }, { status })

    await createContainer().eliminarItem.execute(itemId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return mapDomainError(err)
  }
}
