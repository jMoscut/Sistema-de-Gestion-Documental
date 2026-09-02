/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^\\.{1,2}\\/api(\\.ts)?$': '<rootDir>/src/__mocks__/apiMock.ts',
    'services/publico\\.service(\\.ts)?$': '<rootDir>/src/__mocks__/publico.service.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { jsx: 'react-jsx', esModuleInterop: true },
      diagnostics: false,
    }],
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.types.ts',
  ],
  coverageThreshold: {
    global: { lines: 50 },
  },
}

module.exports = config
