import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db';

const router = Router();

type StatusQuery = 'active' | 'completed' | undefined;

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/**
 * @openapi
 * /api/todos:
 *   get:
 *     tags: [todos]
 *     summary: Список задач, опционально фильтр ?status=active|completed
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, completed] }
 *     responses:
 *       200:
 *         description: Массив задач
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Todo' } }
 *       400:
 *         description: Невалидный status
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as StatusQuery | string | undefined;
    if (status !== undefined && status !== 'active' && status !== 'completed') {
      res.status(400).json({
        error: 'Validation error',
        message: 'query param "status" must be one of: active, completed',
      });
      return;
    }
    const todos = await prisma.todo.findMany({
      where:
        status === 'active'
          ? { completed: false }
          : status === 'completed'
            ? { completed: true }
            : undefined,
      orderBy: { id: 'asc' },
    });
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/todos:
 *   post:
 *     tags: [todos]
 *     summary: Создать задачу
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties: { title: { type: string, example: 'Написать API-тест' } }
 *     responses:
 *       201: { description: Созданная задача }
 *       400: { description: Невалидный title }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title } = req.body as { title?: unknown };
    if (typeof title !== 'string' || title.trim() === '') {
      res.status(400).json({
        error: 'Validation error',
        message: 'body.title is required and must be a non-empty string',
      });
      return;
    }
    if (title.trim().length > 200) {
      res.status(400).json({
        error: 'Validation error',
        message: 'body.title must be at most 200 characters',
      });
      return;
    }
    const todo = await prisma.todo.create({ data: { title: title.trim() } });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/todos/{id}:
 *   patch:
 *     tags: [todos]
 *     summary: Обновить задачу (completed и/или title)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Обновлённая задача }
 *       400: { description: Невалидный id или body }
 *       404: { description: Задача не найдена }
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Validation error', message: 'param "id" must be a positive integer' });
      return;
    }
    const { completed, title } = req.body as { completed?: unknown; title?: unknown };

    if (completed === undefined && title === undefined) {
      res.status(400).json({
        error: 'Validation error',
        message: 'body must contain at least one of: completed, title',
      });
      return;
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
      res.status(400).json({
        error: 'Validation error',
        message: 'body.completed must be a boolean',
      });
      return;
    }
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      res.status(400).json({
        error: 'Validation error',
        message: 'body.title must be a non-empty string',
      });
      return;
    }

    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Not found', message: `Todo with id ${id} not found` });
      return;
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: {
        ...(completed !== undefined ? { completed } : {}),
        ...(title !== undefined ? { title: (title as string).trim() } : {}),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/todos/{id}:
 *   delete:
 *     tags: [todos]
 *     summary: Удалить задачу
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Удалена }
 *       400: { description: Невалидный id }
 *       404: { description: Задача не найдена }
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ error: 'Validation error', message: 'param "id" must be a positive integer' });
      return;
    }
    const existing = await prisma.todo.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Not found', message: `Todo with id ${id} not found` });
      return;
    }
    await prisma.todo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
