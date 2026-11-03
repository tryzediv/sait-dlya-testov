import { todosApi } from "./client";
import type { Todo } from "./types";


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

