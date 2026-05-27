/**
 * Tests de HTTP adapters — API Mesas
 *
 * GET  /api/mesas     → 401 sin auth, 200 con lista
 * POST /api/mesas     → 401 sin auth, 403 sin rol admin, 400 validación, 201 creada
 * PATCH /api/mesas/[id] → 401, 403, 400 capacidad, 200 actualizada, 404 no existe
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/mesas/route'
import { PATCH }     from '@/app/api/mesas/[id]/route'
import { NotFoundError } from '@/domain/errors/DomainErrors'
import type { Mesa } from '@/domain/entities/Mesa'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/infrastructure/auth/getCurrentUser')
jest.mock('@/container')

import { getAuthUser }      from '@/infrastructure/auth/getCurrentUser'
import { createContainer }  from '@/container'

const mockGetAuthUser     = getAuthUser as jest.MockedFunction<typeof getAuthUser>
const mockCreateContainer = createContainer as jest.MockedFunction<typeof createContainer>

// ── Helpers ────────────────────────────────────────────────────────────────────

const userMesero = { id: 'user-1', rol: 'mesero' as const, nombre: 'Juan' }
const userAdmin  = { id: 'user-2', rol: 'admin'  as const, nombre: 'Admin' }

const mesaEjemplo: Mesa = {
  id: 'mesa-1', numero: 1, capacidad: 4,
  estado: 'libre', created_at: '2026-01-01T00:00:00Z',
}

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
    getMesasConEstado: { execute: jest.fn().mockResolvedValue([]) },
    crearMesa:         { execute: jest.fn().mockResolvedValue(mesaEjemplo) },
    editarMesa:        { execute: jest.fn().mockResolvedValue(mesaEjemplo) },
    ...overrides,
  } as unknown as ReturnType<typeof createContainer>)
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── GET /api/mesas ─────────────────────────────────────────────────────────────

describe('GET /api/mesas', () => {
  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('devuelve 200 con la lista de mesas para usuario autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    const mesas = [mesaEjemplo]
    mockContainer({ getMesasConEstado: { execute: jest.fn().mockResolvedValue(mesas) } })

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe('mesa-1')
  })

  it('devuelve 500 si el caso de uso lanza un error inesperado', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({ getMesasConEstado: { execute: jest.fn().mockRejectedValue(new Error('DB error')) } })

    const res = await GET()
    expect(res.status).toBe(500)
    expect(spy).toHaveBeenCalledWith('[API Error]', expect.any(Error))
    spy.mockRestore()
  })
})

// ── POST /api/mesas ────────────────────────────────────────────────────────────

describe('POST /api/mesas', () => {
  it('devuelve 401 si no hay usuario autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas', 'POST', { numero: 5, capacidad: 4 })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no tiene rol admin', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas', 'POST', { numero: 5, capacidad: 4 })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.code).toBe('FORBIDDEN')
  })

  it('devuelve 400 si el body no pasa la validación Zod', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas', 'POST', { numero: -1, capacidad: 0 })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('devuelve 201 con la mesa creada cuando los datos son válidos', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ crearMesa: { execute: jest.fn().mockResolvedValue(mesaEjemplo) } })

    const req = makeRequest('http://localhost/api/mesas', 'POST', { numero: 1, capacidad: 4 })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.numero).toBe(1)
  })

  it('mapea DomainError a su código HTTP correspondiente', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ crearMesa: { execute: jest.fn().mockRejectedValue(new NotFoundError('x')) } })

    const req = makeRequest('http://localhost/api/mesas', 'POST', { numero: 1, capacidad: 4 })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ── PATCH /api/mesas/[id] ──────────────────────────────────────────────────────

describe('PATCH /api/mesas/[id]', () => {
  const ctx = { params: Promise.resolve({ id: 'mesa-1' }) }

  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas/mesa-1', 'PATCH', { capacidad: 6 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si no es admin', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas/mesa-1', 'PATCH', { capacidad: 6 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si capacidad es inválida', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer()

    const req = makeRequest('http://localhost/api/mesas/mesa-1', 'PATCH', { capacidad: 0 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(400)
  })

  it('devuelve 200 con la mesa actualizada', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ editarMesa: { execute: jest.fn().mockResolvedValue({ ...mesaEjemplo, capacidad: 6 }) } })

    const req = makeRequest('http://localhost/api/mesas/mesa-1', 'PATCH', { capacidad: 6 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.capacidad).toBe(6)
  })

  it('devuelve 404 si la mesa no existe (NotFoundError del caso de uso)', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ editarMesa: { execute: jest.fn().mockRejectedValue(new NotFoundError('Mesa no encontrada')) } })

    const req = makeRequest('http://localhost/api/mesas/no-existe', 'PATCH', { capacidad: 4 })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'no-existe' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })
})
