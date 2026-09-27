import axios from 'axios';

// Базовый инстанс для всех API-вызовов песочницы.
// baseURL берётся из VITE_API_URL (docker-compose задаёт http://localhost:4000).
// Таймаут 10с с запасом под CART_DELAY_MS=1500 на GET /api/cart.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
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
