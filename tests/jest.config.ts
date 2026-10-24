import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  rootDir: '..',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'frontend/src/**/*.ts',
    '!frontend/src/**/*.tsx',
    '!frontend/src/api/client.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {

    global: { branches: 70, functions: 80, lines: 80, statements: 80 },

  },
  transform: {
    '^.+\\.tsx?$': [
      '<rootDir>/tests/node_modules/ts-jest/dist/index.js',
      {
        tsconfig: '<rootDir>/tests/tsconfig.json'
      }
    ]
  },
  clearMocks: true,
  verbose: true,
  coverageProvider: 'v8',
};

export default config;