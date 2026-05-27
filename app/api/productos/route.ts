import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { mapDomainError } from '@/lib/http/mapError'
import { productoSchema } from '@/lib/validaciones'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const todos = searchParams.get('todos') === 'true' && user.rol === 'admin'
    const categoria = searchParams.get('categoria')

    const container = createContainer()
    let productos = await container.getProductos.execute(!todos)
    if (categoria) productos = productos.filter(p => p.categoria === categoria)

    return NextResponse.json(productos)
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
    const result = productoSchema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })

    const producto = await createContainer().crearProducto.execute({
      ...result.data,
      descripcion: result.data.descripcion ?? null,
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (err) {
    return mapDomainError(err)
  }
}
