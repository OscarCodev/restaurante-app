import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.ts',
    '<rootDir>/__tests__/components/**/*.test.tsx',
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    'lib/supabase/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    'lib/validaciones.ts',
    'lib/calculos.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches:   40,
      functions:  57,
      lines:      47,
      statements: 44,
    },
  },
}

export default createJestConfig(config)
