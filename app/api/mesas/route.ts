import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { mesaSchema } from '@/lib/validaciones'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const mesas = await createContainer().getMesasConEstado.execute()
    return NextResponse.json(mesas)
  } catch (err) {
    return mapDomainError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })
    if (user.rol !== 'admin') return NextResponse.json({ error: 'Sin permisos', code: 'FORBIDDEN' }, { status: 403 })

    const body = await request.json()
    const result = mesaSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })

    const mesa = await createContainer().crearMesa.execute(result.data.numero, result.data.capacidad)
    return NextResponse.json(mesa, { status: 201 })
  } catch (err) {
    return mapDomainError(err)
  }
}
