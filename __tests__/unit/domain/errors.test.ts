/**
 * Tests de la jerarquía de errores de dominio
 *
 * Verifica que cada error tenga el code y el name correcto,
 * y que la herencia de DomainError → Error funcione.
 */

import {
  DomainError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '@/domain/errors/DomainErrors'

describe('DomainError (base)', () => {
  it('es instancia de Error', () => {
    const err = new DomainError('TEST_CODE', 'mensaje de prueba')
    expect(err).toBeInstanceOf(Error)
  })

  it('expone code y message correctamente', () => {
    const err = new DomainError('MY_CODE', 'mi mensaje')
    expect(err.code).toBe('MY_CODE')
    expect(err.message).toBe('mi mensaje')
  })

  it('tiene name DomainError', () => {
    expect(new DomainError('X', 'y').name).toBe('DomainError')
  })
})

describe('NotFoundError', () => {
  it('es instancia de DomainError y Error', () => {
    const err = new NotFoundError('Mesa no encontrada')
    expect(err).toBeInstanceOf(DomainError)
    expect(err).toBeInstanceOf(Error)
  })

  it('tiene code NOT_FOUND', () => {
    expect(new NotFoundError('x').code).toBe('NOT_FOUND')
  })

  it('propaga el mensaje correctamente', () => {
    expect(new NotFoundError('Pedido no encontrado').message).toBe('Pedido no encontrado')
  })
})

describe('ConflictError', () => {
  it('es instancia de DomainError', () => {
    expect(new ConflictError('MESA_OCUPADA', 'ocupada')).toBeInstanceOf(DomainError)
  })

  it('usa el code pasado en el constructor', () => {
    expect(new ConflictError('MESA_OCUPADA', 'msg').code).toBe('MESA_OCUPADA')
    expect(new ConflictError('CONFLICT', 'msg').code).toBe('CONFLICT')
  })

  it('propaga el mensaje', () => {
    expect(new ConflictError('X', 'ya cerrado').message).toBe('ya cerrado')
  })
})

describe('ValidationError', () => {
  it('tiene code VALIDATION_ERROR', () => {
    expect(new ValidationError('precio negativo').code).toBe('VALIDATION_ERROR')
  })

  it('propaga el mensaje', () => {
    expect(new ValidationError('El pedido no tiene ítems').message).toBe('El pedido no tiene ítems')
  })
})

describe('ForbiddenError', () => {
  it('tiene code FORBIDDEN', () => {
    expect(new ForbiddenError('Sin permisos').code).toBe('FORBIDDEN')
  })

  it('es instancia de DomainError', () => {
    expect(new ForbiddenError('x')).toBeInstanceOf(DomainError)
  })
})

describe('UnauthorizedError', () => {
  it('tiene code UNAUTHORIZED', () => {
    expect(new UnauthorizedError('No autenticado').code).toBe('UNAUTHORIZED')
  })

  it('es instancia de DomainError', () => {
    expect(new UnauthorizedError('x')).toBeInstanceOf(DomainError)
  })
})
