/**
 * Tests de HTTP adapters — API Pedidos
 *
 * GET  /api/pedidos     → 401 sin auth, 200 con lista
 * POST /api/pedidos     → 401, 400 validación, 201 creado, 409 mesa ocupada
 *
 * NOTA: Zod v4 valida UUID estricto RFC 4122 (version bits [1-8], variant [89abAB]).
 *       Usamos 550e8400-e29b-41d4-a716-446655440000 como UUID de prueba.
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/pedidos/route'
import { ConflictError, NotFoundError, ValidationError } from '@/domain/errors/DomainErrors'
import type { Pedido, PedidoConMesa } from '@/domain/entities/Pedido'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/infrastructure/auth/getCurrentUser')
jest.mock('@/container')

import { getAuthUser }     from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'

const mockGetAuthUser     = getAuthUser as jest.MockedFunction<typeof getAuthUser>
const mockCreateContainer = createContainer as jest.MockedFunction<typeof createContainer>

// ── Helpers ────────────────────────────────────────────────────────────────────

const userMesero = { id: 'user-1', rol: 'mesero' as const, nombre: 'Juan' }
const userAdmin  = { id: 'user-2', rol: 'admin'  as const, nombre: 'Admin' }

// UUID v4 válido (version bit=4, variant bit=a) — requerido por Zod v4
const MESA_UUID = '550e8400-e29b-41d4-a716-446655440000'

const pedidoEjemplo: Pedido = {
  id: 'pedido-1', mesa_id: 'mesa-1', usuario_id: 'user-1',
  estado: 'abierto', total: 0, comensales: 2,
  fecha_apertura: '2026-05-27T10:00:00Z', fecha_cierre: null,
  created_at: '2026-05-27T10:00:00Z',
}

const pedidoConMesa: PedidoConMesa = { ...pedidoEjemplo, mesa: { id: 'mesa-1', numero: 1 } }

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  return {
    method,
    json: jest.fn().mockResolvedValue(body ?? {}),
    nextUrl: new URL(url),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as NextRequest
}

function mockContainer(overrides: Record<string, unknown> = {}) {
  mockCreateContainer.mockReturnValue({
    getPedidos:   { execute: jest.fn().mockResolvedValue([pedidoConMesa]) },
    crearPedido:  { execute: jest.fn().mockResolvedValue(pedidoEjemplo) },
    ...overrides,
  } as unknown as ReturnType<typeof createContainer>)
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/pedidos ───────────────────────────────────────────────────────────

describe('GET /api/pedidos', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos', 'GET')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 200 con la lista de pedidos', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({ getPedidos: { execute: jest.fn().mockResolvedValue([pedidoConMesa]) } })

    const req = makeRequest('http://localhost/api/pedidos', 'GET')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
  })

  it('pasa userId y esAdmin=false cuando el usuario es mesero', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    const executeMock = jest.fn().mockResolvedValue([])
    mockContainer({ getPedidos: { execute: executeMock } })

    const req = makeRequest('http://localhost/api/pedidos', 'GET')
    await GET(req)

    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'user-1', esAdmin: false })
    )
  })

  it('pasa esAdmin=true cuando el usuario es admin', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    const executeMock = jest.fn().mockResolvedValue([])
    mockContainer({ getPedidos: { execute: executeMock } })

    const req = makeRequest('http://localhost/api/pedidos', 'GET')
    await GET(req)

    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({ esAdmin: true })
    )
  })
})

// ── POST /api/pedidos ─────────────────────────────────────────────────────────

describe('POST /api/pedidos', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: MESA_UUID, comensales: 2 })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 400 si el body no pasa la validación Zod (mesa_id inválido)', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: 'no-es-uuid', comensales: 0 })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('devuelve 201 con el pedido creado', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({ crearPedido: { execute: jest.fn().mockResolvedValue(pedidoEjemplo) } })

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: MESA_UUID, comensales: 2 })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('pedido-1')
  })

  it('devuelve 409 MESA_OCUPADA si la mesa ya está ocupada', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({
      crearPedido: { execute: jest.fn().mockRejectedValue(new ConflictError('MESA_OCUPADA', 'La mesa ya está ocupada')) },
    })

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: MESA_UUID, comensales: 2 })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('MESA_OCUPADA')
  })

  it('devuelve 404 si la mesa no existe', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({
      crearPedido: { execute: jest.fn().mockRejectedValue(new NotFoundError('Mesa no encontrada')) },
    })

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: MESA_UUID, comensales: 2 })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('devuelve 400 si los comensales superan la capacidad (ValidationError del caso de uso)', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({
      crearPedido: { execute: jest.fn().mockRejectedValue(new ValidationError('Supera la capacidad de la mesa')) },
    })

    const req = makeRequest('http://localhost/api/pedidos', 'POST', { mesa_id: MESA_UUID, comensales: 99 })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })
})
