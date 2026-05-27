import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.ts',
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    // ── Capas testeables con unit tests ──────────────────────────────────────
    'domain/**/*.ts',
    'application/**/*.ts',
    'lib/http/**/*.ts',
    'lib/validaciones.ts',
    'lib/calculos.ts',
    'app/api/**/*.ts',
    // ── Excluidos de umbrales globales ──────────────────────────────────────────
    // infrastructure/**: dependen de Supabase real → integration tests
    // auth/login y auth/logout: infraestructura de identidad (no dominio de negocio)
    '!infrastructure/**/*.ts',
    '!container/**/*.ts',
    '!app/api/auth/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches:   60,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },
}

export default createJestConfig(config)
