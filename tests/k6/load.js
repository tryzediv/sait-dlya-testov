// Load: держит ли норму? Рампа 0 → 20 → 0, цикл «каталог → в корзину → заказ».
// Корзина — синглтон на всех VU, поэтому чужой checkout честно даёт
// 400 «Cart is empty»: принимаем обе ветки, считаем только заказы 201.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, jsonSafe } from './lib.js';

const ordersCreated = new Counter('orders_created');
const flowTime = new Trend('flow_time');

export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    checks: ['rate>0.8'],
    flow_time: ['p(95)<8000'],
  },
};

export default function () {
  const start = Date.now();

  const products = http.get(`${BASE_URL}/api/products`);
  check(products, { 'catalog 200': (r) => r.status === 200 });
  if (products.status !== 200) return;

  // Товар раздаём по номеру VU, но из живого каталога, а не из хардкода.
  const list = jsonSafe(products);
  if (!Array.isArray(list) || list.length === 0) return;
  const productId = list[__VU % list.length].id;

  const add = http.post(
    `${BASE_URL}/api/cart/items`,
    JSON.stringify({ productId, quantity: 1 }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const addOk = check(add, { 'cart add 200': (r) => r.status === 200 });
  if (!addOk) return;

  sleep(1);

  const order = http.post(`${BASE_URL}/api/checkout`);
  const bought = check(order, {
    'checkout 201 or empty-cart 400': (r) => {
      if (r.status === 201) return true;
      const body = jsonSafe(r);
      return r.status === 400 && body !== null && body.message === 'Cart is empty';
    },
  });
  if (bought && order.status === 201) {
    ordersCreated.add(1);
    flowTime.add(Date.now() - start);
  }

  sleep(1);
}
