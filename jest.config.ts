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
    'app/api/productos/route.ts',
    'app/api/pedidos/route.ts',
    'lib/supabase/**/*.ts',
    'lib/validaciones.ts',
    'lib/calculos.ts',
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
