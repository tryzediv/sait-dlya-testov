import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../db';

const router = Router();

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [checkout]
 *     summary: Оформить заказ — снапшот цен, очистка корзины, возврат ID заказа
 *     responses:
 *       201: { description: Созданный заказ }
 *       400: { description: Корзина пуста }
 */
router.post('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const lines = await prisma.cartItem.findMany({ include: { product: true } });
    if (lines.length === 0) {
      res.status(400).json({ error: 'Validation error', message: 'Cart is empty' });
      return;
    }
    const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

    // Заказ + строки + очистка корзины — одной транзакцией, иначе E2E поймает половинчатое состояние.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data: { total } });
      await tx.orderItem.createMany({
        data: lines.map((l) => ({
          orderId: created.id,
          productId: l.productId,
          quantity: l.quantity,
          price: l.product.price, // снапшот цены на момент покупки
        })),
      });
      await tx.cartItem.deleteMany();
      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true },
      });
    });

    res.status(201).json({ orderId: order.id, total: order.total, items: order.items });
  } catch (err) {
    next(err);
  }
});

export default router;
