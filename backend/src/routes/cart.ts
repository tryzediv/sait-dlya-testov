import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db';

const router = Router();

/** Искусственная задержка GET /api/cart — тренируем spinners/waits. По умолчанию 1500 мс. */
function cartDelayMs(): number {
  const raw = Number(process.env.CART_DELAY_MS ?? 1500);
  return Number.isFinite(raw) && raw >= 0 ? raw : 1500;
}

function parseProductId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

type CartLine = {
  productId: number;
  quantity: number;
  subtotal: number;
  product: { id: number; name: string; price: number; imageUrl: string; category: string };
};

async function readCart(): Promise<{ items: CartLine[]; total: number }> {
  const rows = await prisma.cartItem.findMany({
    include: { product: true },
    orderBy: { id: 'asc' },
  });
  const items: CartLine[] = rows.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    subtotal: r.product.price * r.quantity,
    product: {
      id: r.product.id,
      name: r.product.name,
      price: r.product.price,
      imageUrl: r.product.imageUrl,
      category: r.product.category,
    },
  }));
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  return { items, total };
}

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [cart]
 *     summary: Корзина (с искусственной задержкой CART_DELAY_MS для тренировки waits)
 *     responses:
 *       200: { description: Корзина с итогом }
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await new Promise((resolve) => setTimeout(resolve, cartDelayMs()));
    res.json(await readCart());
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [cart]
 *     summary: Добавить товар в корзину (повторный POST увеличивает количество)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantity: { type: integer, example: 2 }
 *     responses:
 *       200: { description: Корзина после добавления }
 *       400: { description: Невалидный productId/quantity }
 *       404: { description: Товар не найден }
 */
router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body as { productId?: unknown; quantity?: unknown };
    if (typeof productId !== 'number' || !Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: 'Validation error', message: 'body.productId must be a positive integer' });
      return;
    }
    const qty = quantity === undefined ? 1 : quantity;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty <= 0) {
      res.status(400).json({ error: 'Validation error', message: 'body.quantity must be a positive integer' });
      return;
    }
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      res.status(404).json({ error: 'Not found', message: `Product with id ${productId} not found` });
      return;
    }
    // Upsert: один товар — одна строка, повторный POST суммирует количество.
    await prisma.cartItem.upsert({
      where: { productId },
      create: { productId, quantity: qty },
      update: { quantity: { increment: qty } },
    });
    res.json(await readCart());
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/cart/items/{productId}:
 *   patch:
 *     tags: [cart]
 *     summary: Изменить количество (quantity=0 удаляет строку)
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, example: 2 }
 *     responses:
 *       200: { description: Корзина после изменения }
 *       400: { description: Невалидные данные }
 *       404: { description: Товар или строка корзины не найдены }
 */
router.patch('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseProductId(req.params.productId);
    if (productId === null) {
      res.status(400).json({ error: 'Validation error', message: 'param "productId" must be a positive integer' });
      return;
    }
    const { quantity } = req.body as { quantity?: unknown };
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 0) {
      res.status(400).json({ error: 'Validation error', message: 'body.quantity must be a non-negative integer' });
      return;
    }
    const existing = await prisma.cartItem.findUnique({ where: { productId } });
    if (!existing) {
      res.status(404).json({ error: 'Not found', message: `Cart item with productId ${productId} not found` });
      return;
    }
    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { productId } });
    } else {
      await prisma.cartItem.update({ where: { productId }, data: { quantity } });
    }
    res.json(await readCart());
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/cart/items/{productId}:
 *   delete:
 *     tags: [cart]
 *     summary: Убрать товар из корзины
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Корзина после удаления }
 *       400: { description: Невалидный productId }
 *       404: { description: Строка корзины не найдена }
 */
router.delete('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseProductId(req.params.productId);
    if (productId === null) {
      res.status(400).json({ error: 'Validation error', message: 'param "productId" must be a positive integer' });
      return;
    }
    const existing = await prisma.cartItem.findUnique({ where: { productId } });
    if (!existing) {
      res.status(404).json({ error: 'Not found', message: `Cart item with productId ${productId} not found` });
      return;
    }
    await prisma.cartItem.delete({ where: { productId } });
    res.json(await readCart());
  } catch (err) {
    next(err);
  }
});

export default router;
