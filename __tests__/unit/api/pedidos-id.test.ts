/**
 * Tests de HTTP adapters — Rutas de pedido individual
 *
 * GET    /api/pedidos/[id]              → GetPedidoConDetalle
 * PUT    /api/pedidos/[id]/cerrar       → CerrarPedido
 * POST   /api/pedidos/[id]/items        → AgregarItem
 * PATCH  /api/pedidos/[id]/items/[id]   → EditarItem
 * DELETE /api/pedidos/[id]/items/[id]   → EliminarItem
 *
 * NOTA: Zod v4 valida UUID estricto RFC 4122.
 * UUID de prueba válido: 550e8400-e29b-41d4-a716-446655440000
 */

import { NextRequest } from 'next/server'
import { GET }         from '@/app/api/pedidos/[id]/route'
import { PUT }         from '@/app/api/pedidos/[id]/cerrar/route'
import { POST }        from '@/app/api/pedidos/[id]/items/route'
import { PATCH, DELETE } from '@/app/api/pedidos/[id]/items/[itemId]/route'
import { NotFoundError, ValidationError, ConflictError } from '@/domain/errors/DomainErrors'
import type { PedidoConDetalle, Pedido } from '@/domain/entities/Pedido'
import type { DetallePedido }            from '@/domain/entities/DetallePedido'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/infrastructure/auth/getCurrentUser')
jest.mock('@/container')
jest.mock('@/infrastructure/supabase/server')

import { getAuthUser }     from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import { createClient }    from '@/infrastructure/supabase/server'

const mockGetAuthUser     = getAuthUser     as jest.MockedFunction<typeof getAuthUser>
const mockCreateContainer = createContainer as jest.MockedFunction<typeof createContainer>
const mockCreateClient    = createClient    as jest.MockedFunction<typeof createClient>

// ── Helpers ────────────────────────────────────────────────────────────────────

const userMesero = { id: 'user-1', rol: 'mesero' as const, nombre: 'Juan' }
const userAdmin  = { id: 'user-2', rol: 'admin'  as const, nombre: 'Admin' }

const PROD_UUID = '550e8400-e29b-41d4-a716-446655440000'

const pedidoAbierto: Pedido = {
  id: 'pedido-1', mesa_id: 'mesa-1', usuario_id: 'user-1',
  estado: 'abierto', total: 50, comensales: 2,
  fecha_apertura: '2026-05-27T10:00:00Z', fecha_cierre: null,
  created_at: '2026-05-27T10:00:00Z',
}

const pedidoConDetalle: PedidoConDetalle = {
  ...pedidoAbierto,
  mesa: { id: 'mesa-1', numero: 1 },
  items: [],
}

const detalle: DetallePedido = {
  id: 'det-1', pedido_id: 'pedido-1', producto_id: 'p1',
  cantidad: 1, precio_unitario: 35, subtotal: 35,
  created_at: '2026-05-27T10:00:00Z',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeCtx(params: Record<string, string>): any {
  return { params: Promise.resolve(params) }
}

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  return {
    method,
    json: jest.fn().mockResolvedValue(body ?? {}),
    nextUrl: new URL(url),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest
}

/** Crea un mock de supabase que devuelve el dato indicado en .single() */
function mockSupabase(data: unknown | null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq:     jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error: data ? null : { message: 'not found' } }),
  }
  mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue(chain) } as never)
}

function mockContainer(overrides: Record<string, unknown> = {}) {
  mockCreateContainer.mockReturnValue({
    getPedidoConDetalle: { execute: jest.fn().mockResolvedValue(pedidoConDetalle) },
    cerrarPedido:        { execute: jest.fn().mockResolvedValue(pedidoConDetalle) },
    agregarItem:         { execute: jest.fn().mockResolvedValue(detalle) },
    editarItem:          { execute: jest.fn().mockResolvedValue(detalle) },
    eliminarItem:        { execute: jest.fn().mockResolvedValue(undefined) },
    ...overrides,
  } as unknown as ReturnType<typeof createContainer>)
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/pedidos/[id] ──────────────────────────────────────────────────────

describe('GET /api/pedidos/[id]', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1', 'GET')
    const res = await GET(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si el pedido no existe', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({ getPedidoConDetalle: { execute: jest.fn().mockResolvedValue(null) } })

    const req = makeRequest('http://localhost/api/pedidos/no-existe', 'GET')
    const res = await GET(req, makeCtx({ id: 'no-existe' }))
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si el mesero intenta acceder al pedido de otro usuario', async () => {
    const otroMesero = { ...userMesero, id: 'otro-user' }
    mockGetAuthUser.mockResolvedValue(otroMesero)
    mockContainer() // pedidoConDetalle.usuario_id es 'user-1', otroMesero es 'otro-user'

    const req = makeRequest('http://localhost/api/pedidos/pedido-1', 'GET')
    const res = await GET(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(403)
  })

  it('devuelve 200 si el mesero accede a su propio pedido', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero) // user-1 === pedido.usuario_id
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1', 'GET')
    const res = await GET(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(200)
  })

  it('el admin puede acceder al pedido de cualquier mesero', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1', 'GET')
    const res = await GET(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(200)
  })
})

// ── PUT /api/pedidos/[id]/cerrar ───────────────────────────────────────────────

describe('PUT /api/pedidos/[id]/cerrar', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/cerrar', 'PUT')
    const res = await PUT(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si supabase no encuentra el pedido', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/no-existe/cerrar', 'PUT')
    const res = await PUT(req, makeCtx({ id: 'no-existe' }))
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si el mesero intenta cerrar el pedido de otro', async () => {
    mockGetAuthUser.mockResolvedValue({ ...userMesero, id: 'otro' })
    mockSupabase({ usuario_id: 'user-1' }) // el pedido pertenece a user-1, no a 'otro'
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/cerrar', 'PUT')
    const res = await PUT(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(403)
  })

  it('devuelve 200 al cerrar el propio pedido', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ usuario_id: 'user-1' })
    mockContainer({ cerrarPedido: { execute: jest.fn().mockResolvedValue(pedidoConDetalle) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/cerrar', 'PUT')
    const res = await PUT(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(200)
  })

  it('devuelve 400 si el caso de uso lanza ValidationError (sin ítems)', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ usuario_id: 'user-1' })
    mockContainer({ cerrarPedido: { execute: jest.fn().mockRejectedValue(new ValidationError('El pedido no tiene ítems')) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/cerrar', 'PUT')
    const res = await PUT(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(400)
  })
})

// ── POST /api/pedidos/[id]/items ───────────────────────────────────────────────

describe('POST /api/pedidos/[id]/items', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items', 'POST', { producto_id: PROD_UUID, cantidad: 1 })
    const res = await POST(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si el pedido no existe', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/no-existe/items', 'POST', { producto_id: PROD_UUID, cantidad: 1 })
    const res = await POST(req, makeCtx({ id: 'no-existe' }))
    expect(res.status).toBe(404)
  })

  it('devuelve 409 si el pedido está cerrado', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'cerrado', usuario_id: 'user-1' })
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items', 'POST', { producto_id: PROD_UUID, cantidad: 1 })
    const res = await POST(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(409)
  })

  it('devuelve 400 si el body no pasa la validación Zod', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items', 'POST', { producto_id: 'no-uuid', cantidad: 0 })
    const res = await POST(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(400)
  })

  it('devuelve 201 con el ítem agregado', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer({ agregarItem: { execute: jest.fn().mockResolvedValue(detalle) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items', 'POST', { producto_id: PROD_UUID, cantidad: 1 })
    const res = await POST(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('det-1')
  })

  it('devuelve 404 si el producto no existe (NotFoundError del caso de uso)', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer({ agregarItem: { execute: jest.fn().mockRejectedValue(new NotFoundError('Producto no encontrado')) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items', 'POST', { producto_id: PROD_UUID, cantidad: 1 })
    const res = await POST(req, makeCtx({ id: 'pedido-1' }))
    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/pedidos/[id]/items/[itemId] ────────────────────────────────────

describe('PATCH /api/pedidos/[id]/items/[itemId]', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'PATCH', { cantidad: 2 })
    const res = await PATCH(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(401)
  })

  it('devuelve 400 si la cantidad es inválida', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'PATCH', { cantidad: 0 })
    const res = await PATCH(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(400)
  })

  it('devuelve 200 con el ítem actualizado', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer({ editarItem: { execute: jest.fn().mockResolvedValue({ ...detalle, cantidad: 2, subtotal: 70 }) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'PATCH', { cantidad: 2 })
    const res = await PATCH(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cantidad).toBe(2)
  })
})

// ── DELETE /api/pedidos/[id]/items/[itemId] ───────────────────────────────────

describe('DELETE /api/pedidos/[id]/items/[itemId]', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'DELETE')
    const res = await DELETE(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(401)
  })

  it('devuelve 200 al eliminar el ítem', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'abierto', usuario_id: 'user-1' })
    mockContainer({ eliminarItem: { execute: jest.fn().mockResolvedValue(undefined) } })

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'DELETE')
    const res = await DELETE(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('devuelve 409 si el pedido está cerrado (no se puede eliminar ítem)', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockSupabase({ estado: 'cerrado', usuario_id: 'user-1' })
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos/pedido-1/items/det-1', 'DELETE')
    const res = await DELETE(req, makeCtx({ id: 'pedido-1', itemId: 'det-1' }))
    expect(res.status).toBe(409)
  })
})
