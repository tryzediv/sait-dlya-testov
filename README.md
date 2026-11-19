# QA Sandbox — песочница курса автоматизации тестирования

123

Учебное веб-приложение для практики **Unit-, API- и E2E-тестов**.
Авторизации нет (MVP), фронт и бэк разделены, всё поднимается **одной командой**.

| Таб | Ключевые точки |
|---|---|---|
| 🧮 Калькулятор | Чистые функции в `frontend/src/calculator/calculate.ts`, `data-testid="calc-*"` |
| ✅ To-Do List | CRUD `GET/POST/PATCH/DELETE /api/todos`, фильтр `?status=active\|completed` |
| 🛒 Магазин | Поиск с debounce 300 мс, спиннер корзины ~1.5 с, модалка, checkout |

**Служебное:** `POST /api/test/reset-db` — очищает `todos`, `cart_items`, `orders`. Все интерактивные элементы имеют `data-testid`.

---

## 1. Требования

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2 (`docker compose version`)
- Без Docker (только для локальной разработки): Node.js **24+**, PostgreSQL **16+**

Порты должны быть свободны: **5173** (frontend), **4000** (backend), **5432** (postgres).

## 2. Быстрый старт (Docker — основной путь)

```bash
# из корня репозитория
docker compose up --build
```

Первый запуск займёт несколько минут (сборка образов, миграции, seed товаров).
Готовность: в логах backend появится `listening on :4000`.

| Что | Где |
|---|---|
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:4000/api/health → `{"status":"ok"}` |
| Swagger (OpenAPI 3.0) | http://localhost:4000/api/docs |

Остановка: `Ctrl+C`, затем (опционально, с удалением контейнеров):

```bash
docker compose down
# с удалением данных БД:
docker compose down -v
```

> `backend/.env.example` — образец переменных окружения. Создавать `.env` для Docker не нужно: compose передаёт всё через `environment` (см. `docker-compose.yml`). `.env` файлы никогда не коммитим (см. `.gitignore`).

## 3. Проверка, что всё работает

```bash
# Бэк жив?
curl http://localhost:4000/api/health

# Todos отвечают?
curl http://localhost:4000/api/todos; echo
# Товары засеяны (должно вернуть 6)?
curl http://localhost:4000/api/products | python3 -c "import json,sys; print(len(json.load(sys.stdin)), 'products')"

# Todos CRUD + reset:
curl -X POST http://localhost:4000/api/test/reset-db
curl -X POST http://localhost:4000/api/todos \
  -H 'Content-Type: application/json' -d '{"title":"Купить молоко"}'
curl 'http://localhost:4000/api/todos?status=active'

# Корзина с задержкой (~1.5 с — так задумано, см. CART_DELAY_MS):
time curl http://localhost:4000/api/cart
```

Затем откройте http://localhost:5173 и покликайте три таба вручную.

## 4. Локальная разработка без Docker

### Backend

```bash
cd backend
cp .env.example .env          # поправьте DATABASE_URL под свой Postgres
npm install
npx prisma migrate dev        # применить миграции
npm run prisma:seed           # засеять 6 товаров (идемпотентно)
npm run dev                   # http://localhost:4000, Swagger: /api/docs
```

Переменные окружения (`backend/.env`):

| Переменная | Пример | Назначение |
|---|---|---|
| `DATABASE_URL` | `postgresql://qa:qa@localhost:5432/qa_sandbox?schema=public` | Подключение Prisma к Postgres |
| `PORT` | `4000` | Порт Express |
| `CART_DELAY_MS` | `1500` | Искусственная задержка `GET /api/cart` для тренировки waits/spinners |

Полезное: `npm run prisma:studio` — GUI для БД; `npm run lint` — проверка типов (`tsc --noEmit`).

### Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxy /api → backend)
```

| Команда | Назначение |
|---|---|
| `npm run dev` | Vite dev-сервер с hot-reload |
| `npm run lint` | Проверка типов |
| `npm run build` | Прод-сборка в `dist/` |

Адрес API задаётся через `VITE_API_URL` (по умолчанию `http://localhost:4000`).
При `npm run dev` запросы на `/api/*` дополнительно проксируются Vite на backend (см. `vite.config.ts`).

## 5. Структура репозитория

```
├── docker-compose.yml      # postgres + backend + frontend (healthchecks, qa-net, pgdata)
├── backend/
│   ├── src/
│   │   ├── index.ts        # точка входа
│   │   ├── app.ts          # Express: CORS, JSON, Swagger, /health, /test/reset-db
│   │   ├── db.ts           # PrismaClient singleton
│   │   ├── swagger.ts      # OpenAPI 3.0 (схемы + автоподхват @openapi из routes/)
│   │   ├── seed.ts         # 6 стартовых товаров
│   │   └── routes/         # todos.ts, products.ts, cart.ts, checkout.ts
│   ├── prisma/
│   │   ├── schema.prisma   # Todo, Product, CartItem, Order, OrderItem
│   │   └── migrations/     # коммитим! применяются через migrate deploy в Docker
│   └── .env.example        # образец env (сам .env — только локально, в git не идёт)
└── frontend/
    └── src/
        ├── App.tsx         # 3 таба (локальный useState, без роутера)
        ├── api/client.ts   # axios-инстанс (baseURL, timeout 10с, формат ошибок)
        ├── calculator/     # calculate.ts (чистые функции) + Calculator.tsx
        ├── todos/          # api.ts + Todos.tsx
        └── shop/           # api.ts + Shop.tsx + useDebouncedValue.ts
```

## 6. API-шпаргалка для курса

Все ошибки — JSON `{ "error": "...", "message": "..." }`.
Полная интерактивная документация: **`/api/docs`** (Swagger UI), сырой JSON: `/api/docs.json`.

```
GET    /api/health                    # живость (docker healthcheck)
POST   /api/test/reset-db             # сброс todos/cart/orders

GET    /api/todos[?status=active|completed]
POST   /api/todos                     # { title }
PATCH  /api/todos/:id                 # { completed?, title? }
DELETE /api/todos/:id                 # → 204

GET    /api/products[?category=][&search=]
GET    /api/products/:id
GET    /api/cart                      # задержка CART_DELAY_MS (≈1.5 с)
POST   /api/cart/items                # { productId, quantity=1 } — upsert
PATCH  /api/cart/items/:productId     # { quantity } (0 = удалить строку)
DELETE /api/cart/items/:productId
POST   /api/checkout                  # → 201 { orderId, total, items }, чистит корзину
```

## 7. Troubleshooting

| Симптом | Причина и лечение |
|---|---|
| `EADDRINUSE` / «port is already allocated» | Порты 5173/4000/5432 заняты. Найдите процесс (`ss -ltnp \| grep 5432`) или поднимите только нужное: `docker compose up frontend backend` |
| Backend перезапускается, в логах `Can't reach database` | Postgres ещё стартует — healthcheck сам дождётся (`depends_on: service_healthy`). Если висит минутами: `docker compose logs postgres` |
| Пустой каталог товаров | Не отработал seed. В Docker он запускается в CMD автоматически; локально: `npm run prisma:seed` из `backend/` |
| `P3005` / «database schema is not empty» при migrate | БД создавалась без Prisma. Локально: сбросьте схему (`npx prisma migrate reset`) — **только для dev, данные удалятся** |
| Фронт показывает Network error | Проверьте `VITE_API_URL` и что backend отвечает на `/api/health`. В Docker frontend ходит на `http://localhost:4000` из браузера — backend должен быть доступен с хоста |
| `npm install` падает на `@types/...` | Проверьте доступ к npm-registry. Версии зафиксированы в `package-lock.json` — ставьте через `npm ci` для точной воспроизводимости |

## 8. Что дальше (идеи для курса)

- Пагинация `GET /api/products`, редактирование названия todo inline, история заказов `GET /api/orders`
