import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Единая точка настройки API — через VITE_API_URL.
// В браузере запросы идут относительным путём (baseURL = '' в api/client.ts)
// на тот же origin, откуда открыт фронт, а dev-прокси ниже перебрасывает
// /api в бэкенд. Внутри docker-сети бэкенд доступен по имени сервиса `backend`
// (localhost здесь — сам фронт-контейнер!), локально без docker — localhost:4000.
// VITE_API_URL остаётся запасным выходом, если фронт и бэк на разных хостах
// и прокси не используется (тогда в браузере будет прямой запрос на этот URL).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://backend:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
