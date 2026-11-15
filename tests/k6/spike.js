// Spike: переживёт ли удар? Фон 5 → всплеск 50 → пик 30 с → возврат. Только чтение.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, jsonSafe } from './lib.js';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '10s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 5 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<8000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const products = http.get(`${BASE_URL}/api/products`);
  check(products, { 'catalog 200': (r) => r.status === 200 });
  if (products.status !== 200) return;

  const list = jsonSafe(products);
  check(products, {
    'catalog not empty': () => Array.isArray(list) && list.length > 0,
  });

  const cart = http.get(`${BASE_URL}/api/cart`, { timeout: '10s' });
  check(cart, { 'cart 200': (r) => r.status === 200 });

  sleep(0.5);
}
