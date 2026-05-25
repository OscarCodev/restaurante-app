import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMesas, crearMesa } from '@/lib/supabase/mesas'
import { mesaSchema } from '@/lib/validaciones'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const mesas = await getMesas()

    // Añadir pedido_activo_id a cada mesa
    const { data: pedidosAbiertos } = await supabase
      .from('pedidos')
      .select('id, mesa_id')
      .eq('estado', 'abierto')

    const mesasConPedido = mesas.map(mesa => ({
      ...mesa,
      pedido_activo_id: pedidosAbiertos?.find(p => p.mesa_id === mesa.id)?.id ?? null,
    }))

    return NextResponse.json(mesasConPedido)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    if (perfil?.rol !== 'admin') return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })

    const body = await request.json()
    const result = mesaSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const mesa = await crearMesa(result.data.numero, result.data.capacidad)
    return NextResponse.json(mesa, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique')) {
      return NextResponse.json({ error: 'Número de mesa ya existe', code: 'CONFLICT' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
