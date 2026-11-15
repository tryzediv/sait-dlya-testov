// Mixed: как ведёт себя стенд при смешанной толпе? Один прогон — два потока:
// shopFlow (каталог → корзина → заказ, как в load.js) + todoFlow (CRUD-цикл,
// как в todos.js). Толпа делится 14/6: пик суммарно 20 VU, как в load.js,
// поэтому цифры сравнимы с раздельными прогонами. Метрики у каждого потока
// свои (flow_time vs todo_cycle_time), диагноз «что тормозит» не теряется.
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, jsonSafe } from './lib.js';

const ordersCreated = new Counter('orders_created');
const flowTime = new Trend('flow_time');
const todosCreated = new Counter('todos_created');
const todoCycleTime = new Trend('todo_cycle_time');

export const options = {
  scenarios: {
    shop: {
      executor: 'ramping-vus',
      exec: 'shopFlow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 14 },
        { duration: '1m', target: 14 },
        { duration: '30s', target: 0 },
      ],
    },
    todos: {
      executor: 'ramping-vus',
      exec: 'todoFlow',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 6 },
        { duration: '1m', target: 6 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    checks: ['rate>0.8'],
    flow_time: ['p(95)<8000'],
    todo_cycle_time: ['p(95)<5000'],
  },
};

const headers = { 'Content-Type': 'application/json' };

// Денежный путь из load.js без изменений: каталог → в корзину → заказ.
// Корзина — синглтон на всех VU, чужой checkout честно даёт
// 400 «Cart is empty»: принимаем обе ветки, считаем только заказы 201.
export function shopFlow() {
  const start = Date.now();

  const products = http.get(`${BASE_URL}/api/products`);
  check(products, { 'catalog 200': (r) => r.status === 200 });
  if (products.status !== 200) return;

  const list = jsonSafe(products);
  if (!Array.isArray(list) || list.length === 0) return;
  const productId = list[__VU % list.length].id;

  const add = http.post(
    `${BASE_URL}/api/cart/items`,
    JSON.stringify({ productId, quantity: 1 }),
    { headers },
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

// CRUD-цикл из todos.js без изменений: список → фильтры → создать →
// обновить → удалить → проверка удаления. Созданное удаляем за собой,
// база не раздувается. В title — имя сценария, чтобы VU из shop и todos
// с одинаковыми __VU не дели данные.
export function todoFlow() {
  const start = Date.now();

  const list = http.get(`${BASE_URL}/api/todos`);
  check(list, {
    'todos list 200 and array': (r) => r.status === 200 && Array.isArray(jsonSafe(r)),
  });
  if (list.status !== 200) return;

  const active = http.get(`${BASE_URL}/api/todos?status=active`);
  check(active, {
    'todos active 200': (r) => r.status === 200,
    'todos active only incomplete': (r) => {
      const body = jsonSafe(r);
      return Array.isArray(body) && body.every((t) => t.completed === false);
    },
  });

  const title = `k6-todo ${exec.scenario.name} vu${__VU} iter${__ITER} ${Date.now()}`;
  const created = http.post(`${BASE_URL}/api/todos`, JSON.stringify({ title }), { headers });
  const createOk = check(created, {
    'todo create 201': (r) => r.status === 201,
    'todo title kept': (r) => {
      const body = jsonSafe(r);
      return body !== null && body.title === title;
    },
  });
  if (!createOk) return;

  const createdBody = jsonSafe(created);
  if (createdBody === null || typeof createdBody.id !== 'number') return;
  const id = createdBody.id;
  todosCreated.add(1);

  sleep(1);

  const patched = http.patch(
    `${BASE_URL}/api/todos/${id}`,
    JSON.stringify({ completed: true }),
    { headers },
  );
  check(patched, {
    'todo patch 200': (r) => r.status === 200,
    'todo marked completed': (r) => {
      const body = jsonSafe(r);
      return body !== null && body.completed === true;
    },
  });

  const del = http.del(`${BASE_URL}/api/todos/${id}`);
  const delOk = check(del, { 'todo delete 204': (r) => r.status === 204 });
  if (!delOk) return;

  const again = http.del(`${BASE_URL}/api/todos/${id}`);
  check(again, { 'todo double delete 404': (r) => r.status === 404 });

  todoCycleTime.add(Date.now() - start);

  sleep(1);
}
