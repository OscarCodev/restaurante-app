import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { editarProducto } from '@/lib/supabase/productos'

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/productos/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })

    const body = await request.json()
    const producto = await editarProducto(id, body)
    return NextResponse.json(producto)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
