/**
 * Tests de lib/http/mapError.ts
 *
 * Verifica que cada DomainError se convierta en el código HTTP correcto
 * y que los errores inesperados devuelvan 500.
 */

import { mapDomainError } from '@/lib/http/mapError'
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
  DomainError,
} from '@/domain/errors/DomainErrors'

// Silenciar console.error durante estos tests
beforeAll(() => { jest.spyOn(console, 'error').mockImplementation(() => {}) })
afterAll(() => { (console.error as jest.Mock).mockRestore() })

async function parseResponse(res: Response) {
  return { status: res.status, body: await res.json() }
}

describe('mapDomainError — DomainErrors conocidos', () => {
  it('NotFoundError → 404', async () => {
    const res = mapDomainError(new NotFoundError('Mesa no encontrada'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(404)
    expect(body.code).toBe('NOT_FOUND')
    expect(body.error).toBe('Mesa no encontrada')
  })

  it('ConflictError MESA_OCUPADA → 409', async () => {
    const res = mapDomainError(new ConflictError('MESA_OCUPADA', 'La mesa ya está ocupada'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(409)
    expect(body.code).toBe('MESA_OCUPADA')
  })

  it('ConflictError CONFLICT → 409', async () => {
    const res = mapDomainError(new ConflictError('CONFLICT', 'Pedido ya cerrado'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(409)
    expect(body.code).toBe('CONFLICT')
  })

  it('ValidationError → 400', async () => {
    const res = mapDomainError(new ValidationError('Datos inválidos'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(400)
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  it('ForbiddenError → 403', async () => {
    const res = mapDomainError(new ForbiddenError('Sin permisos'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(403)
    expect(body.code).toBe('FORBIDDEN')
  })

  it('UnauthorizedError → 401', async () => {
    const res = mapDomainError(new UnauthorizedError('No autenticado'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(401)
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('DomainError con code desconocido → 500 (fallback)', async () => {
    const res = mapDomainError(new DomainError('UNKNOWN_CODE', 'error raro'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(500)
    expect(body.code).toBe('UNKNOWN_CODE')
  })
})

describe('mapDomainError — errores inesperados', () => {
  it('Error genérico de JS → 500 INTERNAL_ERROR', async () => {
    const res = mapDomainError(new Error('algo inesperado'))
    const { status, body } = await parseResponse(res)
    expect(status).toBe(500)
    expect(body.code).toBe('INTERNAL_ERROR')
  })

  it('string lanzado → 500 INTERNAL_ERROR', async () => {
    const res = mapDomainError('error como string')
    const { status, body } = await parseResponse(res)
    expect(status).toBe(500)
    expect(body.code).toBe('INTERNAL_ERROR')
  })

  it('null lanzado → 500 INTERNAL_ERROR', async () => {
    const res = mapDomainError(null)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(500)
    expect(body.code).toBe('INTERNAL_ERROR')
  })
})
