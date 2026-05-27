import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { itemSchema } from '@/lib/validaciones'
import { createAdminClient } from '@/infrastructure/supabase/admin'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items'>) {
  try {
    const { id } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    // Verificar pedido abierto y autorización
    const supabase = await createAdminClient()
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('estado, usuario_id')
      .eq('id', id)
      .single()

    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })
    if (pedido.estado === 'cerrado') return NextResponse.json({ error: 'El pedido está cerrado', code: 'CONFLICT' }, { status: 409 })
    if (user.rol !== 'admin' && pedido.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await request.json()
    const result = itemSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })

    const item = await createContainer().agregarItem.execute(id, result.data.producto_id, result.data.cantidad)
    return NextResponse.json(item, { status: 201 })
  } catch (err) {
    return mapDomainError(err)
  }
}
