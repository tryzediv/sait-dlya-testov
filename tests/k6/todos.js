// Todos: CRUD под нагрузкой без мусора. Каждый круг — полный жизненный цикл:
// список → фильтры → создать → обновить → удалить → проверка удаления.
// Созданное удаляем за собой, база не раздувается, сброс перед прогоном не нужен.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, jsonSafe } from './lib.js';

const todosCreated = new Counter('todos_created');
const todoCycleTime = new Trend('todo_cycle_time');

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    checks: ['rate>0.95'],
    todo_cycle_time: ['p(95)<5000'],
  },
};

const headers = { 'Content-Type': 'application/json' };

export default function () {
  const start = Date.now();

  const list = http.get(`${BASE_URL}/api/todos`);
  check(list, {
    'todos list 200 and array': (r) => r.status === 200 && Array.isArray(jsonSafe(r)),
  });
  if (list.status !== 200) return;

  // Фильтры — та же логика, что в API-тестах (?status=active/completed).
  const active = http.get(`${BASE_URL}/api/todos?status=active`);
  check(active, {
    'todos active 200': (r) => r.status === 200,
    'todos active only incomplete': (r) => {
      const body = jsonSafe(r);
      return Array.isArray(body) && body.every((t) => t.completed === false);
    },
  });

  // Уникальный title на круг: параллельные VU не делят данные.
  const title = `k6-todo vu${__VU} iter${__ITER} ${Date.now()}`;
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

  // Повторное удаление обязано дать 404 — задача реально исчезла.
  const again = http.del(`${BASE_URL}/api/todos/${id}`);
  check(again, { 'todo double delete 404': (r) => r.status === 404 });

  todoCycleTime.add(Date.now() - start);

  sleep(1);
}
