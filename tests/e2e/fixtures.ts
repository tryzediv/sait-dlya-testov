import { test as base, type APIRequestContext } from '@playwright/test';
import { TodosPage } from './pages/TodosPage';
import { ShopPage } from './pages/ShopPage';

/**
 * Общие фикстуры E2E.
 *
 * Как здесь устроены сетап и тирдаун:
 *  - сетап — код фикстуры ДО `await use(...)`: чистим корзину (shopApi),
 *    открываем вкладку (todosPage / shopPage);
 *  - тирдаун — код ПОСЛЕ `await use(...)`: удаляем созданные задачи (todosApi),
 *    снова чистим корзину (shopApi).
 */

export interface E2eTodo {
  id: number;
  title: string;
  completed: boolean;
}

export interface E2eProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export interface E2eCartLine {
  productId: number;
  quantity: number;
  subtotal: number;
  product: E2eProduct;
}

export interface E2eCart {
  items: E2eCartLine[];
  total: number;
}

export interface CheckoutResult {
  orderId: number;
  total: number;
}

/** Мост в Todos API: создание, поиск, удаление + авточистка. */
export interface TodosApi {
  /** Уникальное название, чтобы тесты не цепляли чужие данные. */
  uniqueTitle(prefix?: string): string;
  /** POST /api/todos. Созданное НЕ трекается — чистит сам тест или track(). */
  create(title?: string): Promise<E2eTodo>;
  /** Ищет задачу по точному названию через GET /api/todos. */
  findByTitle(title: string): Promise<E2eTodo | null>;
  /** DELETE /api/todos/:id (404 — уже удалена — не ошибка). */
  delete(id: number): Promise<void>;
  /**
   * Зарегистрировать название для автоудаления в тирдауне фикстуры.
   * Вызывайте после создания задачи через UI.
   */
  track(title: string): void;
}

/** Мост в Shop/Cart API: каталог, корзина, checkout + авточистка. */
export interface ShopApi {
  /** GET /api/products — весь каталог. */
  products(): Promise<E2eProduct[]>;
  /** GET /api/cart (на бэкенде задержка ~1.5 с — учитывайте в ожиданиях). */
  cart(): Promise<E2eCart>;
  /** POST /api/cart/items. */
  addToCart(productId: number, quantity?: number): Promise<E2eCart>;
  /** PATCH /api/cart/items/:productId. */
  setQuantity(productId: number, quantity: number): Promise<E2eCart>;
  /** DELETE /api/cart/items/:productId (404 — уже нет — не ошибка). */
  removeFromCart(productId: number): Promise<void>;
  /** Убрать все строки из корзины. */
  clearCart(): Promise<void>;
  /** POST /api/checkout. */
  checkout(): Promise<CheckoutResult>;
}

type Fixtures = {
  todosApi: TodosApi;
  shopApi: ShopApi;
  todosPage: TodosPage;
  shopPage: ShopPage;
};

async function readJson<T>(
  res: { ok(): boolean; status(): number; json(): Promise<unknown> },
  what: string,
): Promise<T> {
  if (!res.ok()) {
    throw new Error(`${what} -> HTTP ${res.status()}`);
  }
  return (await res.json()) as T;
}

export const test = base.extend<Fixtures>({
  todosApi: async ({ request }, use) => {
    const tracked = new Set<string>();

    const api: TodosApi = {
      uniqueTitle(prefix = 'E2E todo'): string {
        return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
      },

      async create(title = api.uniqueTitle()): Promise<E2eTodo> {
        const res = await request.post('/api/todos', { data: { title } });
        if (res.status() !== 201) {
          throw new Error(`POST /api/todos -> HTTP ${res.status()}`);
        }
        return (await res.json()) as E2eTodo;
      },

      async findByTitle(title: string): Promise<E2eTodo | null> {
        const todos = await readJson<E2eTodo[]>(await request.get('/api/todos'), 'GET /api/todos');
        return todos.find((t) => t.title === title) ?? null;
      },

      async delete(id: number): Promise<void> {
        const res = await request.delete(`/api/todos/${id}`);
        if (res.status() !== 204 && res.status() !== 404) {
          throw new Error(`DELETE /api/todos/${id} -> HTTP ${res.status()}`);
        }
      },

      track(title: string): void {
        tracked.add(title);
      },
    };

    await use(api);

    // Тирдаун: удаляем всё, что тест создал через UI и отметил через track().
    // Best-effort: чистка не должна ронять уже прошедший тест.
    for (const title of tracked) {
      try {
        const found = await api.findByTitle(title);
        if (found !== null) await api.delete(found.id);
      } catch (err) {
        console.error(`[e2e teardown] не удалось удалить задачу «${title}»:`, err);
      }
    }
  },

  shopApi: async ({ request }, use) => {
    const api: ShopApi = {
      async products(): Promise<E2eProduct[]> {
        return readJson<E2eProduct[]>(await request.get('/api/products'), 'GET /api/products');
      },

      async cart(): Promise<E2eCart> {
        return readJson<E2eCart>(await request.get('/api/cart'), 'GET /api/cart');
      },

      async addToCart(productId: number, quantity = 1): Promise<E2eCart> {
        return readJson<E2eCart>(
          await request.post('/api/cart/items', { data: { productId, quantity } }),
          'POST /api/cart/items',
        );
      },

      async setQuantity(productId: number, quantity: number): Promise<E2eCart> {
        return readJson<E2eCart>(
          await request.patch(`/api/cart/items/${productId}`, { data: { quantity } }),
          `PATCH /api/cart/items/${productId}`,
        );
      },

      async removeFromCart(productId: number): Promise<void> {
        const res = await request.delete(`/api/cart/items/${productId}`);
        if (res.status() !== 200 && res.status() !== 404) {
          throw new Error(`DELETE /api/cart/items/${productId} -> HTTP ${res.status()}`);
        }
      },

      async clearCart(): Promise<void> {
        const cart = await api.cart();
        for (const line of cart.items) {
          await api.removeFromCart(line.productId);
        }
      },

      async checkout(): Promise<CheckoutResult> {
        const res = await request.post('/api/checkout');
        if (res.status() !== 201) {
          throw new Error(`POST /api/checkout -> HTTP ${res.status()}`);
        }
        return (await res.json()) as CheckoutResult;
      },
    };

    // Сетап: начинаем с пустой корзины (остатки прошлых прогонов не должны мешать).
    await api.clearCart();
    await use(api);
    // Тирдаун: возвращаем корзину в пустое состояние для следующего теста.
    try {
      await api.clearCart();
    } catch (err) {
      console.error('[e2e teardown] не удалось очистить корзину:', err);
    }
  },

  todosPage: async ({ page }, use) => {
    // Сетап: открытая вкладка To-Do.
    const todosPage = new TodosPage(page);
    await todosPage.open();
    await use(todosPage);
  },

  shopPage: async ({ page, shopApi }, use) => {
    // Зависимость от shopApi гарантирует: корзина уже пуста, когда открывается витрина.
    void shopApi;
    const shopPage = new ShopPage(page);
    await shopPage.open();
    await use(shopPage);
  },
});

export { expect } from '@playwright/test';
export type { APIRequestContext };
