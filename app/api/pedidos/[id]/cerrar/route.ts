import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { createClient } from '@/infrastructure/supabase/server'

export async function PUT(_req: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/cerrar'>) {
  try {
    const { id } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    // Verificar autorización: el pedido debe pertenecer al usuario o ser admin
    const supabase = await createClient()
    const { data: pedidoRaw } = await supabase
      .from('pedidos')
      .select('usuario_id')
      .eq('id', id)
      .single()

    if (!pedidoRaw) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })
    if (user.rol !== 'admin' && pedidoRaw.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    const pedidoCerrado = await createContainer().cerrarPedido.execute(id)
    return NextResponse.json(pedidoCerrado)
  } catch (err) {
    return mapDomainError(err)
  }
}
