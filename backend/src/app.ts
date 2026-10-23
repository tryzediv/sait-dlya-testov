import express from 'express';
import cors from 'cors';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { prisma } from './db';
import todosRouter from './routes/todos';
import productsRouter from './routes/products';
import cartRouter from './routes/cart';
import checkoutRouter from './routes/checkout';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Локальные картинки товаров: файлы лежат в backend/public/images,
  // отдаются по /api/images/* — через тот же origin, что и API,
  // поэтому работают с любого адреса (Vite-прокси пропускает /api).
  // В прод-сборке dist/ лежит рядом с public/ так же, как src/ в dev.
  app.use('/api/images', express.static(path.join(__dirname, '..', 'public', 'images')));

  // Swagger UI — http://localhost:4000/api/docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

  /**
   * @openapi
   * /api/health:
   *   get:
   *     tags: [health]
   *     summary: Проверка живости (для docker healthcheck)
   *     responses:
   *       200:
   *         description: OK
   */
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  /**
   * @openapi
   * /api/test/reset-db:
   *   post:
   *     tags: [test]
   *     summary: Очистить todos, cart и orders (для beforeEach в E2E)
   *     responses:
   *       200:
   *         description: База сброшена
   */
  app.post('/api/test/reset-db', async (_req, res, next) => {
    try {
      // OrderItem удаляется каскадно через Order; CartItem — отдельно.
      await prisma.$transaction([
        prisma.orderItem.deleteMany(),
        prisma.order.deleteMany(),
        prisma.cartItem.deleteMany(),
        prisma.todo.deleteMany(),
      ]);
      res.json({ status: 'ok', reset: ['todos', 'cart_items', 'orders'] });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/todos', todosRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/checkout', checkoutRouter);

  // 404 для неизвестных /api-путей — понятный JSON для API-тестов.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found', message: 'Unknown API endpoint' });
  });

  // Централизованный обработчик ошибок → всегда JSON { error, message }.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: 'Internal error', message: 'Something went wrong' });
    },
  );

  return app;
}
