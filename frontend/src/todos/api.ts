import { api } from '../api/client';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export type TodoFilter = 'all' | 'active' | 'completed';

/** GET /api/todos — фильтр уходит query-параметром ?status= (all = без параметра). */
export async function fetchTodos(filter: TodoFilter): Promise<Todo[]> {
  const params = filter === 'all' ? {} : { status: filter };
  const { data } = await api.get<Todo[]>('/api/todos', { params });
  return data;
}

/** POST /api/todos */
export async function createTodo(title: string): Promise<Todo> {
  const { data } = await api.post<Todo>('/api/todos', { title });
  return data;
}

/** PATCH /api/todos/:id */
export async function updateTodo(
  id: number,
  patch: { completed?: boolean; title?: string },
): Promise<Todo> {
  const { data } = await api.patch<Todo>(`/api/todos/${id}`, patch);
  return data;
}

/** DELETE /api/todos/:id */
export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/api/todos/${id}`);
}
