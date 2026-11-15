// ESLint 9, flat config. Type-aware правила отключены осознанно:
// в проекте нет projectService-настройки, а ts-jest и так проверяет типы тестов.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'coverage/**', 'allure-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // В тестах каст через unknown — штатный приём для проверки default-веток.
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  // k6-скрипты: __VU/__ITER/__ENV — встроенные переменные рантайма k6.
  {
    files: ['k6/**/*.js'],
    languageOptions: {
      globals: { __VU: 'readonly', __ITER: 'readonly', __ENV: 'readonly' },
    },
  },
);
