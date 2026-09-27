import { defineConfig } from 'vitest/config';

// Минимальный конфиг для Unit-тестов курса.
// Запуск: npm run test (watch) или npm run test:run (однократный, для CI).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
