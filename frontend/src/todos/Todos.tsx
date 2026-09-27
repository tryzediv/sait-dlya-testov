import { useCallback, useEffect, useState } from 'react';
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type Todo,
  type TodoFilter,
} from './api';

const FILTERS: Array<{ id: TodoFilter; label: string; testid: string }> = [
  { id: 'all', label: 'Все', testid: 'filter-all' },
  { id: 'active', label: 'Активные', testid: 'filter-active' },
  { id: 'completed', label: 'Выполненные', testid: 'filter-completed' },
];

/**
 * To-Do List: CRUD поверх REST API.
 * Фильтр применяется серверным ?status= — это и есть материал для API-тестов.
 * Все интерактивные элементы имеют data-testid.
 */
export default function Todos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: TodoFilter) => {
    setLoading(true);
    setError(null);
    try {
      setTodos(await fetchTodos(f));
    } catch (e) {
      setError(errMsg(e, 'Не удалось загрузить задачи'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  const handleAdd = async () => {
    const title = draft.trim();
    if (title === '') {
      setError('Введите текст задачи');
      return;
    }
    setError(null);
    try {
      const created = await createTodo(title);
      setDraft('');
      // Если активен фильтр "completed" — новая активная задача под него не подходит,
      // проще перезагрузить список с сервера, чем гадать на клиенте.
      if (filter === 'completed') await load(filter);
      else setTodos((prev) => [...prev, created]);
    } catch (e) {
      setError(errMsg(e, 'Не удалось добавить задачу'));
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      // Серверный фильтр: при ?status=active снятая/поставленная галочка может убрать строку
      if (filter === 'all') {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
      } else {
        await load(filter);
      }
    } catch (e) {
      setError(errMsg(e, 'Не удалось обновить задачу'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(errMsg(e, 'Не удалось удалить задачу'));
    }
  };

  return (
    <section data-testid="todos-page">
      <h2>To-Do List</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          data-testid="new-todo-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          placeholder="Новая задача"
          style={{ padding: 8, flex: 1, maxWidth: 320 }}
        />
        <button data-testid="add-todo-btn" onClick={() => void handleAdd()} style={{ padding: '8px 16px' }}>
          Добавить
        </button>
      </div>

      <div data-testid="todo-filters" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            data-testid={f.testid}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            style={{
              padding: '6px 12px',
              fontWeight: filter === f.id ? 700 : 400,
              border: filter === f.id ? '2px solid #333' : '1px solid #ccc',
              borderRadius: 6,
              background: filter === f.id ? '#eee' : '#fff',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p data-testid="todos-loading">Загрузка…</p>}
      {error !== null && (
        <p data-testid="todos-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {!loading && todos.length === 0 && (
        <p data-testid="todos-empty">Задач нет — добавьте первую.</p>
      )}

      <ul data-testid="todo-list" style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((t) => (
          <li
            key={t.id}
            data-testid={`todo-item-${t.id}`}
            style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}
          >
            <input
              type="checkbox"
              data-testid={`todo-toggle-${t.id}`}
              checked={t.completed}
              onChange={() => void handleToggle(t)}
            />
            <span
              data-testid={`todo-title-${t.id}`}
              style={{ textDecoration: t.completed ? 'line-through' : 'none', flex: 1 }}
            >
              {t.title}
            </span>
            <button data-testid={`todo-delete-${t.id}`} onClick={() => void handleDelete(t.id)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Бэкенд отвечает { error, message } — показываем человекочитаемый message. */
function errMsg(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
