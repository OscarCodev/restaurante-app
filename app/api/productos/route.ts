import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProductos, crearProducto } from '@/lib/supabase/productos'
import { productoSchema } from '@/lib/validaciones'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado', code: 'UNAUTHORIZED' }, { status: 401 })

    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
    const searchParams = request.nextUrl.searchParams
    const todos = searchParams.get('todos') === 'true' && perfil?.rol === 'admin'
    const categoria = searchParams.get('categoria')

    let productos = await getProductos(!todos)
    if (categoria) productos = productos.filter(p => p.categoria === categoria)

    return NextResponse.json(productos)
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
    const result = productoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Datos inválidos', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const producto = await crearProducto({
      ...result.data,
      descripcion: result.data.descripcion ?? null,
    })
    return NextResponse.json(producto, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
