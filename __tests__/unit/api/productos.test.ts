/**
 * Tests de HTTP adapters — API Productos
 *
 * GET  /api/productos     → 401 sin auth, 200 con lista, filtro categoria
 * POST /api/productos     → 401, 403 sin admin, 400 validación, 201 creado
 * PATCH /api/productos/[id] → 401, 403, 200 actualizado, 404 no existe
 */

import { NextRequest } from 'next/server'
import { GET, POST }  from '@/app/api/productos/route'
import { PATCH }      from '@/app/api/productos/[id]/route'
import { NotFoundError } from '@/domain/errors/DomainErrors'
import type { Producto } from '@/domain/entities/Producto'

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

const productoPrincipal: Producto = {
  id: 'p1', nombre: 'Lomo Saltado', descripcion: 'Clásico', precio: 35,
  categoria: 'principal', activo: true, created_at: '2026-01-01T00:00:00Z',
}
const productoBebida: Producto = {
  id: 'p2', nombre: 'Chicha Morada', descripcion: null, precio: 8,
  categoria: 'bebida', activo: true, created_at: '2026-01-01T00:00:00Z',
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
    getProductos:    { execute: jest.fn().mockResolvedValue([productoPrincipal, productoBebida]) },
    crearProducto:   { execute: jest.fn().mockResolvedValue(productoPrincipal) },
    editarProducto:  { execute: jest.fn().mockResolvedValue(productoPrincipal) },
    ...overrides,
  } as unknown as ReturnType<typeof createContainer>)
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/productos ─────────────────────────────────────────────────────────

describe('GET /api/productos', () => {
  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'GET')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 200 con todos los productos activos por defecto', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'GET')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
  })

  it('filtra por categoría cuando se pasa el parámetro', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer({ getProductos: { execute: jest.fn().mockResolvedValue([productoPrincipal, productoBebida]) } })

    const req = makeRequest('http://localhost/api/productos?categoria=principal', 'GET')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].categoria).toBe('principal')
  })

  it('solicita todos los productos cuando admin pasa ?todos=true', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    const executeMock = jest.fn().mockResolvedValue([productoPrincipal, productoBebida])
    mockContainer({ getProductos: { execute: executeMock } })

    const req = makeRequest('http://localhost/api/productos?todos=true', 'GET')
    await GET(req)

    // soloActivos=false cuando admin + todos=true
    expect(executeMock).toHaveBeenCalledWith(false)
  })

  it('ignora ?todos=true si el usuario no es admin', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    const executeMock = jest.fn().mockResolvedValue([productoPrincipal])
    mockContainer({ getProductos: { execute: executeMock } })

    const req = makeRequest('http://localhost/api/productos?todos=true', 'GET')
    await GET(req)

    // soloActivos=true para mesero aunque pase todos=true
    expect(executeMock).toHaveBeenCalledWith(true)
  })
})

// ── POST /api/productos ────────────────────────────────────────────────────────

describe('POST /api/productos', () => {
  const bodyValido = { nombre: 'Causa Limeña', precio: 22, categoria: 'entrada' }

  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'POST', bodyValido)
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no es admin', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'POST', bodyValido)
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si el precio es negativo (validación Zod)', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'POST', { nombre: 'X', precio: -5, categoria: 'bebida' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('devuelve 400 si el nombre está vacío (validación Zod)', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos', 'POST', { nombre: '', precio: 10, categoria: 'bebida' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('devuelve 201 con el producto creado', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ crearProducto: { execute: jest.fn().mockResolvedValue(productoPrincipal) } })

    const req = makeRequest('http://localhost/api/productos', 'POST', bodyValido)
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.nombre).toBe('Lomo Saltado')
  })
})

// ── PATCH /api/productos/[id] ──────────────────────────────────────────────────

describe('PATCH /api/productos/[id]', () => {
  const ctx = { params: Promise.resolve({ id: 'p1' }) }

  it('devuelve 401 si no está autenticado', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos/p1', 'PATCH', { precio: 40 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si no es admin', async () => {
    mockGetAuthUser.mockResolvedValue(userMesero)
    mockContainer()

    const req = makeRequest('http://localhost/api/productos/p1', 'PATCH', { precio: 40 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(403)
  })

  it('devuelve 200 con el producto actualizado', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ editarProducto: { execute: jest.fn().mockResolvedValue({ ...productoPrincipal, precio: 40 }) } })

    const req = makeRequest('http://localhost/api/productos/p1', 'PATCH', { precio: 40 })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.precio).toBe(40)
  })

  it('devuelve 404 si el producto no existe', async () => {
    mockGetAuthUser.mockResolvedValue(userAdmin)
    mockContainer({ editarProducto: { execute: jest.fn().mockRejectedValue(new NotFoundError('Producto no encontrado')) } })

    const req = makeRequest('http://localhost/api/productos/no-existe', 'PATCH', { precio: 40 })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'no-existe' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })
})
