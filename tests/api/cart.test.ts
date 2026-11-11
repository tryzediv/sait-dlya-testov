import { cartApi, checkoutApi } from './client';
import { cartHelper } from './helper';

// Сервер может обрабатывать запросы к корзине с задержкой. Увеличиваем таймаут.
jest.setTimeout(15_000);

const NONEXISTENT_PRODUCT_ID = 999999;

let productIds: number[] = [];

// Выполняется ОДИН раз перед всеми тестами в этом файле
beforeAll(async () => {
  productIds = await cartHelper.productIds(2);
});

// Выполняется ПЕРЕД КАЖДЫМ тестом (it)
beforeEach(async () => {
  await cartHelper.clear();
});


// ---------------------------------------------------------------------------
// GET /api/cart
// ---------------------------------------------------------------------------

describe('GET /api/cart', () => {
  it('возвращает статус 200 и пустую корзину после очистки', async () => {
    const res = await cartApi.get();
    expect(res.status).toBe(200);
    // Строгое сравнение структуры
    expect(res.data).toEqual({ items: [], total: 0 });
  });

  it('строка корзины имеет ожидаемую структуру', async () => {
    const productId = productIds[0];
    // Используем хелпер с очисткой. Добавляем 2 товара.
    await cartHelper.withCleanup(async () => {
      const res = await cartApi.get();
      expect(res.status).toBe(200);
      expect(res.data.items).toHaveLength(1);

      const item = res.data.items[0];
      // expect.objectContaining проверяет наличие указанных полей, игнорируя остальные
      expect(item).toEqual(
        expect.objectContaining({
          productId,
          quantity: 2,
          subtotal: expect.any(Number),
        }),
      );
      expect(item.product).toEqual(
        expect.objectContaining({
          id: productId,
          name: expect.any(String),
          price: expect.any(Number),
          imageUrl: expect.any(String),
          category: expect.any(String),
        }),
      );
      // Сервер считает подытог сам: сверяем арифметику независимо.
      expect(item.subtotal).toBe(item.product.price * item.quantity);
      expect(res.data.total).toBe(item.subtotal);
    }, productId, 2);
  });
});

// ---------------------------------------------------------------------------
// POST /api/cart/items
// ---------------------------------------------------------------------------

describe('POST /api/cart/items', () => {
  it('добавляет товар и возвращает 200', async () => {
    const productId = productIds[0];
    const res = await cartApi.add(productId, 1);
    try {
      expect(res.status).toBe(200);
      expect(res.data.items).toHaveLength(1);
      // toMatchObject проверяет вложенную структуру, менее строгий, чем toEqual
      expect(res.data.items[0]).toMatchObject({ productId, quantity: 1 });
      expect(res.data.total).toBe(res.data.items[0].subtotal);
    } finally {
      await cartHelper.remove(productId);
    }
  });

  it('quantity по умолчанию равен 1', async () => {
    const productId = productIds[0];
    const res = await cartApi.add(productId);
    try {
      expect(res.status).toBe(200);
      expect(res.data.items[0]).toMatchObject({ productId, quantity: 1 });
    } finally {
      await cartHelper.remove(productId);
    }
  });

  it('повторный POST суммирует количество (upsert)', async () => {
    const productId = productIds[0];
    try {
      await cartApi.add(productId, 1);
      const res = await cartApi.add(productId, 2); // Добавляем еще 2
      expect(res.status).toBe(200);
      // Важно: сервер не создает дубликат строки, а обновляет существующую
      expect(res.data.items).toHaveLength(1);
      expect(res.data.items[0]).toMatchObject({ productId, quantity: 3 });
      expect(res.data.items[0].subtotal).toBe(res.data.items[0].product.price * 3);
    } finally {
      await cartHelper.remove(productId);
    }
  });

  it('возвращает 404 для несуществующего товара', async () => {
    const res = await cartApi.add(NONEXISTENT_PRODUCT_ID, 1);
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  type InvalidCartBody = { name: string; body: unknown };

  it.each<InvalidCartBody>([
    { name: 'пустое body', body: {} },
    { name: 'без productId', body: { quantity: 2 } },
    { name: 'productId строкой', body: { productId: 'abc', quantity: 1 } },
    { name: 'productId ноль', body: { productId: 0, quantity: 1 } },
    { name: 'productId отрицательный', body: { productId: -1, quantity: 1 } },
    { name: 'quantity ноль', body: { productId: 1, quantity: 0 } },
    { name: 'quantity отрицательный', body: { productId: 1, quantity: -2 } },
    { name: 'quantity дробный', body: { productId: 1, quantity: 1.5 } },
    { name: 'quantity строкой', body: { productId: 1, quantity: 'много' } },
  ])('возвращает 400: $name', async ({ body }) => {
    const res = await cartApi.addRaw(body);
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/cart/items/:productId
// ---------------------------------------------------------------------------

describe('PATCH /api/cart/items/:productId', () => {
  it('изменяет количество', async () => {
    const productId = productIds[0];
    await cartHelper.withCleanup(async () => {
      const res = await cartApi.update(productId, 5);
      expect(res.status).toBe(200);
      expect(res.data.items).toHaveLength(1);
      expect(res.data.items[0]).toMatchObject({ productId, quantity: 5 });
      expect(res.data.items[0].subtotal).toBe(res.data.items[0].product.price * 5);
      expect(res.data.total).toBe(res.data.items[0].subtotal);
    }, productId, 1);
  });

  it('quantity=0 удаляет строку', async () => {
    const productId = productIds[0];
    await cartHelper.add(productId, 2);

    const res = await cartApi.update(productId, 0);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ items: [], total: 0 });
  });

  it('возвращает 404 для товара не из корзины', async () => {
    const res = await cartApi.update(productIds[1], 2);
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  it.each(['abc', 0, -1])('возвращает 400 для невалидного id: %s', async (productId) => {
    const res = await cartApi.updateRaw(productId, { quantity: 2 });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });

  type InvalidQuantityBody = { name: string; body: unknown };

  it.each<InvalidQuantityBody>([
    { name: 'без quantity', body: {} },
    { name: 'quantity отрицательный', body: { quantity: -1 } },
    { name: 'quantity дробный', body: { quantity: 1.5 } },
    { name: 'quantity строкой', body: { quantity: 'много' } },
  ])('возвращает 400: $name', async ({ body }) => {
    // Строка в корзине есть, но форма ломается раньше поиска — проверяем порядок валидации.
    const productId = productIds[0];
    await cartHelper.withCleanup(async () => {
      const res = await cartApi.updateRaw(productId, body);
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error', 'Validation error');
    }, productId, 1);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/cart/items/:productId
// ---------------------------------------------------------------------------

describe('DELETE /api/cart/items/:productId', () => {
  it('убирает товар и возвращает 200 с пустой корзиной', async () => {
    const productId = productIds[0];
    await cartHelper.add(productId, 2);

    const res = await cartApi.remove(productId);
    // Первое удаление: успех
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ items: [], total: 0 });

    const again = await cartApi.remove(productId);
    // Второе удаление того же товара: не найдено
    expect(again.status).toBe(404);
  });

  it('возвращает 404 для товара не из корзины', async () => {
    const res = await cartApi.remove(productIds[1]);
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  it('возвращает 400 для невалидного id', async () => {
    const res = await cartApi.removeRaw('abc');
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });
});
