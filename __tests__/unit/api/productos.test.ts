/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/productos/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/supabase/productos', () => ({
  getProductos: jest.fn(),
  crearProducto: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getProductos, crearProducto } from '@/lib/supabase/productos'

function makePerfilBuilder(rol: string) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { rol }, error: null }),
  }
}

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
})

describe('GET /api/productos', () => {
  it('devuelve 401 si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const req = new NextRequest('http://localhost/api/productos')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve la lista de productos activos para mesero', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('mesero'))

    const productos = [
      { id: 'p-1', nombre: 'Lomo saltado', precio: 32, categoria: 'principal', activo: true },
    ]
    ;(getProductos as jest.Mock).mockResolvedValue(productos)

    const req = new NextRequest('http://localhost/api/productos')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].nombre).toBe('Lomo saltado')
    expect(getProductos).toHaveBeenCalledWith(true)
  })

  it('admin con ?todos=true recibe también productos inactivos', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-admin' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('admin'))
    ;(getProductos as jest.Mock).mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/productos?todos=true')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(getProductos).toHaveBeenCalledWith(false)
  })

  it('filtra por categoría si se pasa ?categoria=bebida', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('mesero'))

    const productos = [
      { id: 'p-1', nombre: 'Chicha', categoria: 'bebida', activo: true },
      { id: 'p-2', nombre: 'Lomo', categoria: 'principal', activo: true },
    ]
    ;(getProductos as jest.Mock).mockResolvedValue(productos)

    const req = new NextRequest('http://localhost/api/productos?categoria=bebida')
    const res = await GET(req)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].categoria).toBe('bebida')
  })
})

describe('POST /api/productos', () => {
  it('devuelve 401 si no hay sesión', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const req = new NextRequest('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'X', precio: 10, categoria: 'bebida' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no es admin', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-1' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('mesero'))

    const req = new NextRequest('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'X', precio: 10, categoria: 'bebida' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('FORBIDDEN')
  })

  it('devuelve 400 si los datos no pasan validación', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-admin' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('admin'))

    const req = new NextRequest('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre: '', precio: -1, categoria: 'desayuno' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('crea el producto y devuelve 201 con datos válidos', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u-admin' } } })
    mockSupabase.from.mockReturnValue(makePerfilBuilder('admin'))

    const creado = { id: 'p-nuevo', nombre: 'Arroz con leche', precio: 12, categoria: 'postre', activo: true }
    ;(crearProducto as jest.Mock).mockResolvedValue(creado)

    const req = new NextRequest('http://localhost/api/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre: 'Arroz con leche', precio: 12, categoria: 'postre' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.nombre).toBe('Arroz con leche')
    expect(body.id).toBe('p-nuevo')
  })
})
