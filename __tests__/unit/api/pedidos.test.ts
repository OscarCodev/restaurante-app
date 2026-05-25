/**
 * @jest-environment node
 */
import { POST } from '@/app/api/pedidos/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/supabase/pedidos', () => ({
  crearPedido: jest.fn(),
  getPedidos: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { crearPedido } from '@/lib/supabase/pedidos'

const VALID_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

function makeBuilder(resolvedValue: unknown) {
  const builder: Record<string, jest.Mock> = {}
  builder.select = jest.fn().mockReturnValue(builder)
  builder.eq = jest.fn().mockReturnValue(builder)
  builder.single = jest.fn().mockResolvedValue(resolvedValue)
  return builder
}

const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
})

describe('POST /api/pedidos', () => {

  it('devuelve 401 si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: VALID_UUID, comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('devuelve 400 si faltan campos requeridos', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('devuelve 409 si la mesa está ocupada', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    mockSupabase.from.mockReturnValue(
      makeBuilder({ data: { id: VALID_UUID, estado: 'ocupada', capacidad: 4 }, error: null })
    )

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: VALID_UUID, comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe('MESA_OCUPADA')
  })

  it('crea el pedido y devuelve 201 si la mesa está libre', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    mockSupabase.from.mockReturnValue(
      makeBuilder({ data: { id: VALID_UUID, estado: 'libre', capacidad: 4 }, error: null })
    )

    const pedidoCreado = {
      id: 'uuid-pedido', mesa_id: VALID_UUID, usuario_id: 'uuid-user',
      estado: 'abierto', total: 0, comensales: 2,
    }
    ;(crearPedido as jest.Mock).mockResolvedValue(pedidoCreado)

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: VALID_UUID, comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.estado).toBe('abierto')
    expect(body.total).toBe(0)
  })
})

describe('PUT /api/pedidos/[id]/cerrar', () => {
  it('devuelve 400 si el pedido no tiene ítems', async () => {
    // placeholder — implementar con mock de detalle_pedido vacío
  })

  it('devuelve 409 si el pedido ya está cerrado', async () => {
    // placeholder — implementar con mock de pedido con estado = 'cerrado'
  })
})
