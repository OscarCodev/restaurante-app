/**
 * @jest-environment node
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const mockSupabase: any = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

jest.mock('@/lib/supabase/pedidos', () => ({
  crearPedido: jest.fn(),
  getPedidos: jest.fn(),
}))

const { GET, POST } = require('@/app/api/pedidos/route') as typeof import('@/app/api/pedidos/route')
const { createClient } = require('@/lib/supabase/server') as typeof import('@/lib/supabase/server')
const { crearPedido, getPedidos } = require('@/lib/supabase/pedidos') as typeof import('@/lib/supabase/pedidos')

const VALID_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

function makeBuilder(resolvedValue: any): any {
  const builder: any = {}
  builder.select = jest.fn().mockReturnValue(builder)
  builder.eq = jest.fn().mockReturnValue(builder)
  builder.single = jest.fn(() => Promise.resolve(resolvedValue))
  return builder
}

beforeEach(() => {
  jest.clearAllMocks()
})

const mockedGetPedidos = getPedidos as any
const mockedCrearPedido = crearPedido as any

describe('GET /api/pedidos', () => {
  it('devuelve 401 si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest('http://localhost/api/pedidos')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('devuelve pedidos cuando el usuario está autenticado', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'uuid-user' } } })
    mockSupabase.from.mockReturnValue(makeBuilder({ data: { rol: 'mesero' }, error: null }))

    const pedidos = [{ id: 'pedido-1', estado: 'abierto', total: 25 }]
    mockedGetPedidos.mockResolvedValue(pedidos)

    const request = new NextRequest('http://localhost/api/pedidos?estado=abierto')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(pedidos)
  })
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
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'uuid-user' } } })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('devuelve 409 si la mesa está ocupada', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'uuid-user' } } })
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
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'uuid-user' } } })
    mockSupabase.from.mockReturnValue(
      makeBuilder({ data: { id: VALID_UUID, estado: 'libre', capacidad: 4 }, error: null })
    )

    const pedidoCreado = {
      id: 'uuid-pedido',
      mesa_id: VALID_UUID,
      usuario_id: 'uuid-user',
      estado: 'abierto',
      total: 0,
      comensales: 2,
    }
    mockedCrearPedido.mockResolvedValue(pedidoCreado)

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
