import { todosApi } from "./client";
import { todosHelper, uniq } from "./helper";


// ---------------------------------------------------------------------------
// GET /api/todos
// ---------------------------------------------------------------------------
describe('GET /api/todos', () => {

  it('возвращает статус 200 и массив задач', async () => {
    const res = await todosApi.get();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('задачи имеют ожидаемую структуру', async () => {
    
    await todosHelper.withCleanup(async () => {
      const res = await todosApi.get();
      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThan(0);

      for (const t of res.data) {
        expect(t).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
            completed: expect.any(Boolean),
          }),
        );
      }
    });
  });

  it('фильтрует по ?status=active', async () => {
    await todosHelper.withCleanup(async () => {
      const res = await todosApi.get({ params: { status: 'active' } });
      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThan(0);

      for (const t of res.data) {
        expect(t.completed).toBe(false);
      }
    });
  })

  it('фильтрует по ?status=completed', async () => {
    await todosHelper.withCleanup(async (created) => {
      // Сначала меняем статус созданной задачи
      const patched = await todosApi.update(created.id, { completed: true });
      expect(patched.status).toBe(200);
      // Теперь проверяем, что она попадает в фильтр completed
      const res = await todosApi.get({ params: { status: 'completed' } });
      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data.map((t: { id: number }) => t.id)).toContain(created.id);
      for (const t of res.data) {
        expect(t.completed).toBe(true);
      }
    });
  });

  it('возвращает 400 для невалидного status', async () => {
    const res = await todosApi.get({ params: { status: 'done' } });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  })
});

// ---------------------------------------------------------------------------
// POST /api/todos
// ---------------------------------------------------------------------------
describe('POST /api/todos', () => {
  it('создаем задачу и возвращаем 201', async () => {
    const title = uniq('Новая задача');
    const res = await todosApi.create({ title });
    try {
      expect(res.status).toBe(201);
      expect(res.data).toMatchObject({ title, completed: false });
      expect(res.data.id).toEqual(expect.any(Number));
    } finally {
      await todosHelper.delete(res.data.id);
    }
  });

  it('обрезает пробелы в title', async () => {
    const res = await todosApi.create({ title: '   с пробелами   ' });
    try {
      expect(res.status).toBe(201);
      expect(res.data.title).toBe('с пробелами');
    } finally {
      await todosHelper.delete(res.data.id);
    }
  });

  it.each([
    { name: 'без title', body: {} },
    { name: 'пустой title', body: { title: '   ' } },
    { name: 'title длиннее 200 символов', body: { title: 'a'.repeat(201) } },
  ])('возвращает 400: $name', async ({ body }) => {
    const res = await todosApi.createRaw(body);
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });
});


// ---------------------------------------------------------------------------
// PATCH /api/todos/:id
// ---------------------------------------------------------------------------
describe('PATCH /api/todos/:id', () => {

  it('обновляет completed', async () => {
    await todosHelper.withCleanup(async (created) => {
      const res = await todosApi.update(created.id, { completed: true });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ id: created.id, completed: true });
    });
  });

  it('обновляет title', async () => {
    await todosHelper.withCleanup(async (created) => {
      const title = uniq('Переименована');
      const res = await todosApi.update(created.id, { title });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ id: created.id, title });
    });
  });

  it('обновляет completed и title одновременно', async () => {
    await todosHelper.withCleanup(async (created) => {
      const title = uniq('Оба поля');
      const res = await todosApi.update(created.id, {
        completed: true,
        title,
      });
      expect(res.status).toBe(200);
      expect(res.data).toMatchObject({ id: created.id, completed: true, title });
    });
  });

  it('возвращает 404 для несуществующей задачи', async () => {
    const res = await todosApi.update(999999, { completed: true });
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  it('возвращает 400 для невалидного id', async () => {
    const res = await todosApi.updateRaw('abc', { completed: true });
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });

  it('возвращает 400 для пустого body', async () => {
    await todosHelper.withCleanup(async (created) => {
      const res = await todosApi.updateRaw(created.id, {});
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error', 'Validation error');
    });
  });

  it('возвращает 400 для completed не-boolean', async () => {
    await todosHelper.withCleanup(async (created) => {
      const res = await todosApi.updateRaw(created.id, { completed: 'yes' });
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error', 'Validation error');
    });
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/todos/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/todos/:id', () => {

  it('удаляет задачу и возвращает 204', async () => {
    const created = await todosHelper.create();
    // Первое удаление: ожидаем успех
    const res = await todosApi.delete(created.id);
    expect(res.status).toBe(204);
    // Повторное удаление: ожидаем 404, значит задача действительно исчезла.
    const again = await todosApi.delete(created.id);
    expect(again.status).toBe(404);
  });

  it('возвращает 404 для несуществующей задачи', async () => {
    const res = await todosApi.delete(999999);
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  it('возвращает 400 для невалидного id', async () => {
    const res = await todosApi.deleteRaw('abc');
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });
});
