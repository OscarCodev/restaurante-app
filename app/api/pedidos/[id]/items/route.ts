import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agregarItem } from '@/lib/supabase/detalle'
import { itemSchema } from '@/lib/validaciones'

export async function POST(request: NextRequest, ctx: RouteContext<'/api/pedidos/[id]/items'>) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: pedido } = await supabase.from('pedidos').select('estado, usuario_id').eq('id', id).single()
    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado', code: 'NOT_FOUND' }, { status: 404 })
    if (pedido.estado === 'cerrado') return NextResponse.json({ error: 'El pedido está cerrado', code: 'CONFLICT' }, { status: 409 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin' && pedido.usuario_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await request.json()
    const result = itemSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const item = await agregarItem(id, result.data.producto_id, result.data.cantidad)
    return NextResponse.json(item, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'Producto inactivo') return NextResponse.json({ error: 'Producto inactivo', code: 'VALIDATION_ERROR' }, { status: 400 })
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
