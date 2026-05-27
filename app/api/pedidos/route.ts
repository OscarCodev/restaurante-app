import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { pedidoSchema } from '@/lib/validaciones'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const sp = request.nextUrl.searchParams
    const pedidos = await createContainer().getPedidos.execute({
      estado:    sp.get('estado') ?? undefined,
      desde:     sp.get('desde') ?? undefined,
      hasta:     sp.get('hasta') ?? undefined,
      usuarioId: user.id,
      esAdmin:   user.rol === 'admin',
    })

    return NextResponse.json(pedidos)
  } catch (err) {
    return mapDomainError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const result = pedidoSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })

    const pedido = await createContainer().crearPedido.execute(
      result.data.mesa_id,
      user.id,
      result.data.comensales,
    )
    return NextResponse.json(pedido, { status: 201 })
  } catch (err) {
    return mapDomainError(err)
  }
}
