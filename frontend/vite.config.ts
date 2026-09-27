import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Единая точка настройки API — через VITE_API_URL.
// В docker-compose это http://localhost:4000, локально без docker — то же самое.
// dev-прокси нужен, только если фронт ходит относительным путём /api.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
