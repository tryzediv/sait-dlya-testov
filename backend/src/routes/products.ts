import { Router, type Request, type Response, type NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';

const router = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [products]
 *     summary: Каталог товаров (?category=, ?search= по имени и описанию)
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Массив товаров
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query as { category?: string; search?: string };
    const where: Prisma.ProductWhereInput = {};
    if (category !== undefined && category.trim() !== '') {
      where.category = category.trim();
    }
    if (search !== undefined && search.trim() !== '') {
      // Поиск регистронезависимый, по имени и описанию — студентам есть что assert'ить.
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }
    const products = await prisma.product.findMany({ where, orderBy: { id: 'asc' } });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [products]
 *     summary: Один товар (удобно для 404-кейсов в API-тестах)
 *     responses:
 *       200: { description: Товар }
 *       400: { description: Невалидный id }
 *       404: { description: Товар не найден }
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Validation error', message: 'param "id" must be a positive integer' });
      return;
    }
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ error: 'Not found', message: `Product with id ${id} not found` });
      return;
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export default router;
