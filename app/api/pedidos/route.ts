import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crearPedido, getPedidos } from '@/lib/supabase/pedidos'
import { pedidoSchema } from '@/lib/validaciones'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    const sp = request.nextUrl.searchParams

    const pedidos = await getPedidos({
      estado:    sp.get('estado') ?? undefined,
      desde:     sp.get('desde') ?? undefined,
      hasta:     sp.get('hasta') ?? undefined,
      usuarioId: user.id,
      esAdmin:   perfil?.rol === 'admin',
    })

    return NextResponse.json(pedidos)
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const result = pedidoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    // Verificar que la mesa esté libre
    const { data: mesa } = await supabase.from('mesas').select('estado, capacidad').eq('id', result.data.mesa_id).single()
    if (!mesa) return NextResponse.json({ error: 'Mesa no encontrada', code: 'NOT_FOUND' }, { status: 404 })
    if (mesa.estado === 'ocupada') return NextResponse.json({ error: 'La mesa ya está ocupada', code: 'MESA_OCUPADA' }, { status: 409 })
    if (result.data.comensales > mesa.capacidad) {
      return NextResponse.json({ error: 'Supera la capacidad de la mesa', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const pedido = await crearPedido(result.data.mesa_id, user.id, result.data.comensales)
    return NextResponse.json(pedido, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'MESA_OCUPADA') {
      return NextResponse.json({ error: 'La mesa ya tiene un pedido abierto', code: 'MESA_OCUPADA' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
