import { api } from '../../frontend/src/api/client';

import {
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    Todo,
    TodoFilter
} from '../../frontend/src/todos/api';

jest.mock('../../frontend/src/api/client', () => ({
    api: { 
      get: jest.fn(), 
      post: jest.fn(), 
      patch: jest.fn(), 
      delete: jest.fn() 
    },
}));

const mockedApi = api as unknown as {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
};

const todo: Todo = {
    id: 1,
    title: 'Написать тесты',
    completed: true
};

afterEach(() => {
    jest.clearAllMocks();
  });

describe('fetchTodos', () => {
        const todos: Todo[] = [
            { id: 1, title: 'Написать тесты', completed: true },
            { id: 2, title: 'Запушить код', completed: true },
            { id: 3, title: 'Отдохнуть', completed: false },
        ];

    it.each([
        { filter: 'all' as TodoFilter, params: {}, expected: todos },
        { filter: 'active' as TodoFilter, params: { status: 'active' }, expected: todos.filter((t) => t.completed === false) },
        { filter: 'completed' as TodoFilter, params: { status: 'completed' }, expected: todos.filter((t) => t.completed === true) },
    ])('фильтр $filter уходит query-параметром и возвращает подходящие todos', async ({ filter, params, expected }) => {
        mockedApi.get.mockResolvedValue({ data: expected });

        const result = await fetchTodos(filter);

        expect(mockedApi.get).toHaveBeenCalledWith('/api/todos', {
            params,
        });
        expect(result).toEqual(expected);
    });
});

describe('createTodo', () => {
    it('создаёт todo с переданным title', async () => {
        mockedApi.post.mockResolvedValue({ data: todo });

        const result = await createTodo('Написать тесты');

        expect(mockedApi.post).toHaveBeenCalledWith('/api/todos', {
            title: 'Написать тесты',
        });
        expect(result).toEqual(todo);
    });
});

describe('updateTodo', () => {
    it('обновляет completed у todo', async () => {
        const updated: Todo = { ...todo, completed: false };
        mockedApi.patch.mockResolvedValue({ data: updated });

        const result = await updateTodo(1, { completed: false });

        expect(mockedApi.patch).toHaveBeenCalledWith('/api/todos/1', {
            completed: false,
        });
        expect(result).toEqual(updated);
        expect(result.completed).toBe(false);
    });
});

describe('deleteTodo', () => {
    it('удаляет todo по id', async () => {
        mockedApi.delete.mockResolvedValue({});

        await deleteTodo(1);

        expect(mockedApi.delete).toHaveBeenCalledWith('/api/todos/1');
    });
});
