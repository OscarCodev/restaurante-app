import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { editarMesa } from '@/lib/supabase/mesas'

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/mesas/[id]'>) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })

    const { capacidad } = await request.json()
    if (!capacidad || capacidad < 1) {
      return NextResponse.json({ error: 'Capacidad inválida', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const mesa = await editarMesa(id, capacidad)
    return NextResponse.json(mesa)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
