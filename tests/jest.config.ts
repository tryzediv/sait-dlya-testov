import type { Config } from 'jest';

 

const config: Config = {

  // 1. Среда Node.js

  testEnvironment: 'node',

  // 2. Искать тесты в текущей папке и всех вложенных

  roots: ['<rootDir>'],

  // 3. Шаблон имён файлов

  testMatch: [

    '<rootDir>/**/*.test.ts'

  ],

  // 4. Покрытие кода. Путь к frontend теперь указывается через ../, 

  // так как мы находимся внутри папки tests/

  collectCoverageFrom: [

    '../frontend/src/**/*.ts',

    '!**/node_modules/**'

  ],

  // 5. Трансформация через ts-jest с указанием локального tsconfig.json

  transform: {

    '^.+\\.tsx?$': [

      'ts-jest',

      {

        tsconfig: '<rootDir>/tsconfig.json'

      }

    ]

  },

  // 6. Дополнительные настройки

  clearMocks: true,

  verbose: true

};

export default config;