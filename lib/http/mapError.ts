import { NextResponse } from 'next/server'
import { DomainError } from '@/domain/errors/DomainErrors'

const STATUS_MAP: Record<string, number> = {
  NOT_FOUND:        404,
  UNAUTHORIZED:     401,
  FORBIDDEN:        403,
  CONFLICT:         409,
  MESA_OCUPADA:     409,
  VALIDATION_ERROR: 400,
}

export function mapDomainError(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    const status = STATUS_MAP[err.code] ?? 500
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status }
    )
  }
  console.error('[API Error]', err)
  return NextResponse.json(
    { error: 'Error interno', code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
