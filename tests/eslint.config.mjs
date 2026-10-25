// ESLint 9, flat config. Type-aware правила отключены осознанно:
// в проекте нет projectService-настройки, а ts-jest и так проверяет типы тестов.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'coverage/**'] },
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
);
