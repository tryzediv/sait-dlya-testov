import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, jsonSafe } from './lib.js';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { 'health 200': (r) => r.status === 200 });
  if (health.status !== 200) return; // стенд лежит — дальше бессмысленно

  const products = http.get(`${BASE_URL}/api/products`);
  check(products, { 'catalog 200': (r) => r.status === 200 });
  if (products.status !== 200) return;

  // Динамический id вместо хардкода: работаем с тем, что реально вернул сервер.
  const list = jsonSafe(products);
  check(products, {
    'catalog not empty': () => Array.isArray(list) && list.length > 0,
  });
  if (!Array.isArray(list) || list.length === 0) return;

  const productId = list[0].id;
  const product = http.get(`${BASE_URL}/api/products/${productId}`);
  const one = jsonSafe(product);
  check(product, {
    'product 200': (r) => r.status === 200,
    'product id matches': () => one !== null && one.id === productId,
  });

  // Отдельный таймаут: зависший VU блокирует поток, не даём ему висеть вечно.
  const cart = http.get(`${BASE_URL}/api/cart`, { timeout: '10s' });
  check(cart, { 'cart 200': (r) => r.status === 200 });

  sleep(1); // пауза «задумчивости», иначе пулемёт вместо пользователей
}
