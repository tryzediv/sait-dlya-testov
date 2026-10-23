import axios from 'axios';

// Базовый инстанс для всех API-вызовов песочницы.
// По умолчанию — относительный baseURL: запросы идут на тот же origin,
// откуда открыт фронт, а Vite dev-прокси (см. vite.config.ts) перебрасывает
// /api в бэк-контейнер. Так работает с любого адреса сервера, а не только localhost.
// VITE_API_URL можно задать явно, если бэкенд живёт на отдельном хосте.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Сквозной формат ошибок: бэкенд всегда отвечает { error, message }.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.data) {
      return Promise.reject(err.response.data);
    }
    return Promise.reject({ error: 'Network error', message: String(err) });
  },
);
