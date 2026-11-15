// Типы import.meta.env для фронтенд-кода, который юнит-тесты
// импортируют напрямую (frontend/src/api/client.ts и др.).
// Дублирует frontend/src/vite-env.d.ts, чтобы tsc тестов (module: commonjs)
// видел ImportMeta.env. Сам Vite сюда не ставится ради одних типов.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
