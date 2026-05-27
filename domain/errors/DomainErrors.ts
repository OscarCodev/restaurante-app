export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super('NOT_FOUND', message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends DomainError {
  constructor(code: string, message: string) {
    super(code, message)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message)
    this.name = 'ValidationError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super('FORBIDDEN', message)
    this.name = 'ForbiddenError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super('UNAUTHORIZED', message)
    this.name = 'UnauthorizedError'
  }
}
