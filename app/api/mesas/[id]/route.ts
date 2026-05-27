import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/mesas/[id]'>) {
  try {
    const { id } = await ctx.params
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
    if (user.rol !== 'admin') return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })

    const { capacidad } = await request.json()
    if (!capacidad || capacidad < 1) {
      return NextResponse.json({ error: 'Capacidad inválida', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const mesa = await createContainer().editarMesa.execute(id, capacidad)
    return NextResponse.json(mesa)
  } catch (err) {
    return mapDomainError(err)
  }
}
