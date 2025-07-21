export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@modelcontextprotocol/sdk/types\\.js$': '<rootDir>/tests/mocks/mcp-sdk.ts',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/tests/**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    'src/tools/credential/test.ts',
    'src/tools/*/test.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol/sdk)/)'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'node16',
        target: 'es2022',
        moduleResolution: 'node16',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        verbatimModuleSyntax: false,
        isolatedModules: false,
      },
    }],
    '^.+\\.js$': ['ts-jest', {
      useESM: true,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};