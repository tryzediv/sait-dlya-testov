import { test, expect, type TodosApi } from '../fixtures';
import type { TodosPage } from '../pages/TodosPage';

/**
 * E2E: вкладка «To-Do List».
 *
 * Todo-список работает поверх REST API (GET/POST/PATCH/DELETE /api/todos),
 * база у фронта и бэка общая, поэтому каждая задача создаётся с уникальным
 * названием (todosApi.uniqueTitle), а чистка идёт через фикстуру todosApi:
 * созданное через UI регистрируем через track() — тирдаун удалит его
 * через API напрямую, даже если тест упадёт посередине.
 *
 * Фикстура todosPage открывает вкладку до теста (сетап), сам спек
 * занимается только сценарием.
 */

test.describe('To-Do: создание задач', () => {
  test('новая задача появляется в списке', async ({ todosPage, todosApi }) => {
    const title = todosApi.uniqueTitle();
    todosApi.track(title);

    await todosPage.addTodo(title);
    await expect(todosPage.todoByTitle(title)).toBeVisible();
  });

  test('задачу можно создать клавишей Enter', async ({ todosPage, todosApi }) => {
    const title = todosApi.uniqueTitle('E2E enter');
    todosApi.track(title);

    await todosPage.addTodoByEnter(title);
    await expect(todosPage.todoByTitle(title)).toBeVisible();
  });

  test('пустая задача не создаётся, видна ошибка', async ({ todosPage }) => {
    await todosPage.fillDraft('   ');
    await todosPage.addButton.click();

    await expect(todosPage.error).toHaveText('Введите текст задачи');
  });

  test('поле ввода очищается после добавления', async ({ todosPage, todosApi }) => {
    const title = todosApi.uniqueTitle();
    todosApi.track(title);

    await todosPage.addTodo(title);
    await expect(todosPage.newTodoInput).toHaveValue('');
  });

  test('ошибка пустого ввода исчезает после успешного добавления', async ({
    todosPage,
    todosApi,
  }) => {
    await todosPage.fillDraft('   ');
    await todosPage.addButton.click();
    await expect(todosPage.error).toBeVisible();

    const title = todosApi.uniqueTitle();
    todosApi.track(title);
    await todosPage.addTodo(title);

    await expect(todosPage.error).toBeHidden();
    await expect(todosPage.todoByTitle(title)).toBeVisible();
  });
});

test.describe('To-Do: выполнение и удаление', () => {
  test('чекбокс отмечает задачу выполненной (текст зачёркивается)', async ({
    todosPage,
    todosApi,
  }) => {
    const title = todosApi.uniqueTitle('E2E toggle');
    todosApi.track(title);

    await todosPage.addTodo(title);
    const created = await todosApi.findByTitle(title);
    if (created === null) throw new Error(`задача «${title}» не найдена через API`);

    await todosPage.toggleTodo(created.id);

    // Проверяем CSS line-through, а не класс — класс могут переименовать.
    await expect(todosPage.todoTitle(created.id)).toHaveCSS(
      'text-decoration-line',
      'line-through',
    );
    // Повторный клик снимает отметку
    await todosPage.toggleTodo(created.id);
    await expect(todosPage.todoTitle(created.id)).toHaveCSS(
      'text-decoration-line',
      'none',
    );
  });

  test('кнопка «Удалить» убирает задачу из списка и с сервера', async ({
    todosPage,
    todosApi,
  }) => {
    const title = todosApi.uniqueTitle('E2E delete');
    todosApi.track(title);

    await todosPage.addTodo(title);
    const created = await todosApi.findByTitle(title);
    if (created === null) throw new Error(`задача «${title}» не найдена через API`);

    await todosPage.deleteTodo(created.id);

    await expect(todosPage.list).not.toContainText(title);
    // Сервер тоже удалил: повторный поиск ничего не находит.
    expect(await todosApi.findByTitle(title)).toBeNull();
  });

  test('созданная через API задача видна в списке после открытия вкладки', async ({
    page,
    todosPage,
    todosApi,
  }) => {
    // Сервер как источник истины: задача создана мимо UI.
    const title = todosApi.uniqueTitle('E2E api-seed');
    todosApi.track(title);
    await todosApi.create(title);

    await page.reload();
    await todosPage.tab.click();

    await expect(todosPage.todoByTitle(title)).toBeVisible();
  });
});

test.describe('To-Do: фильтры', () => {
  /** Создаёт активную и выполненную задачи, возвращает их названия и id выполненной. */
  async function seedActiveAndDone(
    todosPage: TodosPage,
    todosApi: TodosApi,
  ): Promise<{ activeTitle: string; doneTitle: string; doneId: number }> {
    const activeTitle = todosApi.uniqueTitle('E2E active');
    const doneTitle = todosApi.uniqueTitle('E2E done');
    todosApi.track(activeTitle);
    todosApi.track(doneTitle);

    await todosPage.addTodo(activeTitle);
    await todosPage.addTodo(doneTitle);

    const done = await todosApi.findByTitle(doneTitle);
    if (done === null) throw new Error(`задача «${doneTitle}» не найдена через API`);
    await todosPage.toggleTodo(done.id);
    await expect(todosPage.todoTitle(done.id)).toHaveCSS(
      'text-decoration-line',
      'line-through',
    );

    return { activeTitle, doneTitle, doneId: done.id };
  }

  test('фильтр «Активные» прячет выполненные задачи', async ({ todosPage, todosApi }) => {
    const { activeTitle, doneTitle } = await seedActiveAndDone(todosPage, todosApi);

    await todosPage.applyFilter('active');

    await expect(todosPage.list).toContainText(activeTitle);
    await expect(todosPage.list).not.toContainText(doneTitle);
  });

  test('фильтр «Выполненные» показывает только завершённые', async ({
    todosPage,
    todosApi,
  }) => {
    const { activeTitle, doneTitle } = await seedActiveAndDone(todosPage, todosApi);

    await todosPage.applyFilter('completed');

    await expect(todosPage.list).toContainText(doneTitle);
    await expect(todosPage.list).not.toContainText(activeTitle);
  });

  test('фильтр «Все» возвращает обе группы', async ({ todosPage, todosApi }) => {
    const { activeTitle, doneTitle } = await seedActiveAndDone(todosPage, todosApi);

    await todosPage.applyFilter('completed');
    await expect(todosPage.list).not.toContainText(activeTitle);

    await todosPage.applyFilter('all');
    await expect(todosPage.list).toContainText(activeTitle);
    await expect(todosPage.list).toContainText(doneTitle);
  });

  test('счётчик фильтра: выполненная задача уходит из «Активных» сразу', async ({
    todosPage,
    todosApi,
  }) => {
    const title = todosApi.uniqueTitle('E2E active-leave');
    todosApi.track(title);

    await todosPage.addTodo(title);
    const created = await todosApi.findByTitle(title);
    if (created === null) throw new Error(`задача «${title}» не найдена через API`);

    await todosPage.applyFilter('active');
    await expect(todosPage.todoByTitle(title)).toBeVisible();

    await todosPage.toggleTodo(created.id);
    // Серверный фильтр ?status=active: завершённая строка исчезает без перезагрузки.
    await expect(todosPage.list).not.toContainText(title);
  });
});
