import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]'>) {
  try {
    const { id } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const pedido = await createContainer().getPedidoConDetalle.execute(id)
    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })

    if (user.rol !== 'admin' && pedido.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    return NextResponse.json(pedido)
  } catch (err) {
    return mapDomainError(err)
  }
}

/** DELETE /api/pedidos/[id]  — cancela un pedido vacío (sin ítems) */
export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]'>) {
  try {
    const { id } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    await createContainer().cancelarPedido.execute(id, user.id, user.rol === 'admin')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return mapDomainError(err)
  }
}
