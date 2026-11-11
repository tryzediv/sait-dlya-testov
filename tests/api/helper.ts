import { todosApi, cartApi, productsApi } from "./client";
import type { Todo, Cart } from "./types";


export const uniq = (prefix: string) => `${prefix} ${Date.now()}-${Math.floor(Math.random())}`;

export const todosHelper = {

    /**
   * Создаёт задачу и возвращает её данные. 
   * По умолчанию генерирует уникальное название, чтобы избежать конфликтов.
   */
    async create(title = uniq('Api todo')): Promise<Todo> {
        const res = await todosApi.create({ title });
        if (res.status !== 201) {
            throw new Error(`Не удалось создать задачу. Статус: ${res.status},
                Ответ: ${JSON.stringify(res.data)}`);
        }
        return res.data;
    },

    /**
   * Удаляет задачу по ID. 
   * Метод не выбрасывает ошибку, если задача уже была удалена.
   */
    async delete(id: number): Promise<void> {
        const res = await todosApi.delete(id);
        if (res.status !== 204 && res.status !== 404) {
             throw new Error(
                `Не удалось удалить задачу ${id}. Статус: ${res.status}, Ответ: ${JSON.stringify(res.data)}`,
             );
        }
    },

    /**
   * Создаёт задачу, выполняет переданную функцию и гарантированно удаляет задачу после завершения.
   */
    async withCleanup<T>(
        fn: (todo: Todo) => Promise<T>,
        title?: string,
    ): Promise<T> {
        const todo = await this.create(title);
        try {
            return await fn(todo);
        } finally {
            await this.delete(todo.id);
        }
    },
};

export const cartHelper = {

    /**
     * Возвращает ID первых товаров из каталога.
     * Каталог — справочные данные, их не чистят между тестами.
     */
    async productIds(count = 1): Promise<number[]> {
      const res = await productsApi.getAll();
      if (res.status !== 200 || res.data.length < count) {
        throw new Error(`Не удалось получить ${count} товара из каталога. Статус: ${res.status}`);
      }
      return res.data.slice(0, count).map((p) => p.id);
    },
  
    /**
     * Кладёт товар в корзину и возвращает корзину целиком.
     */
    async add(productId: number, quantity = 1): Promise<Cart> {
      const res = await cartApi.add(productId, quantity);
      if (res.status !== 200) {
        throw new Error(`Не удалось добавить товар ${productId}. Статус: ${res.status}, Ответ: ${JSON.stringify(res.data)}`);
      }
      return res.data;
    },
  
    /**
     * Убирает товар из корзины. Идемпотентный метод.
     */
    async remove(productId: number): Promise<void> {
      const res = await cartApi.remove(productId);
      // 404 означает, что товара уже нет, что для нас является успешным сценарием очистки
      if (res.status !== 200 && res.status !== 404) {
        throw new Error(`Не удалось убрать товар ${productId}. Статус: ${res.status}`);
      }
    },
  
    /**
     * Очищает корзину целиком (построчно).
     */
    async clear(): Promise<void> {
      const res = await cartApi.get();
      if (res.status !== 200) throw new Error(`Не удалось прочитать корзину. Статус: ${res.status}`);
  
      for (const item of res.data.items) {
        await this.remove(item.productId);
      }
    },
  
    /**
     * Паттерн Setup/Teardown: кладёт товар, выполняет тест и гарантированно убирает товар.
     */
    async withCleanup<T>(fn: (cart: Cart) => Promise<T>, productId: number, quantity = 1): Promise<T> {
      const cart = await this.add(productId, quantity);
      try {
        return await fn(cart); // Выполняем тело теста
      } finally {
        await this.remove(productId); // Выполняется ВСЕГДА, даже если тест упал с ошибкой
      }
    },
};  

