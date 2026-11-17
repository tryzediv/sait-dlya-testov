import type { Locator, Page } from "@playwright/test";

/** Фильтры вкладки «To-Do List». */
export type TodosFilter = 'all' | 'active' | 'completed';

/** Page Object вкладки «To-Do List» */
export class TodosPage {
  readonly page: Page;
  readonly tab: Locator;
  readonly pageSection: Locator;
  readonly newTodoInput: Locator;
  readonly addButton: Locator;
  readonly filters: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;
  readonly error: Locator;
  readonly loading: Locator;
  readonly empty: Locator;
  readonly list: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-todos');
    this.pageSection = page.getByTestId('todos-page');
    this.newTodoInput = page.getByTestId('new-todo-input');
    this.addButton = page.getByTestId('add-todo-btn');
    this.filters = page.getByTestId('todo-filters');
    this.filterAll = page.getByTestId('filter-all');
    this.filterActive = page.getByTestId('filter-active');
    this.filterCompleted = page.getByTestId('filter-completed');
    this.error = page.getByTestId('todos-error');
    this.loading = page.getByTestId('todos-loading');
    this.empty = page.getByTestId('todos-empty');
    this.list = page.getByTestId('todo-list');
  }

  /** Открывает вкладку с главной страницы и ждёт появления секции todos. */
  async open(): Promise<void> {
    await this.page.goto('/');
    await this.tab.click();
    await this.pageSection.waitFor();
  }

  /** Заполняет поле новой задачи (без отправки). */
  async fillDraft(title: string): Promise<void> {
    await this.newTodoInput.fill(title);
  }

  /** Создаёт задачу кликом по кнопке «Добавить». */
  async addTodo(title: string): Promise<void> {
    await this.newTodoInput.fill(title);
    await this.addButton.click();
  }

  /** Создаёт задачу клавишей Enter в поле ввода. */
  async addTodoByEnter(title: string): Promise<void> {
    await this.newTodoInput.fill(title);
    await this.newTodoInput.press('Enter');
  }

  /** Кликает по чекбоксу задачи с заданным id. */
  async toggleTodo(id: number): Promise<void> {
    await this.todoToggle(id).click();
  }

  /** Жмёт «Удалить» у задачи с заданным id. */
  async deleteTodo(id: number): Promise<void> {
    await this.todoDelete(id).click();
  }

  /** Переключает фильтр списка. */
  async applyFilter(filter: TodosFilter): Promise<void> {
    switch (filter) {
      case 'active':
        await this.filterActive.click();
        break;
      case 'completed':
        await this.filterCompleted.click();
        break;
      case 'all':
      default:
        await this.filterAll.click();
        break;
    }
  }

  /** Строка задачи по id: `todo-item-<id>`. */
  todoItem(id: number): Locator {
    return this.page.getByTestId(`todo-item-${id}`);
  }

  /** Чекбокс задачи по id: `todo-toggle-<id>`. */
  todoToggle(id: number): Locator {
    return this.page.getByTestId(`todo-toggle-${id}`);
  }

  /** Текст задачи по id: `todo-title-<id>`. */
  todoTitle(id: number): Locator {
    return this.page.getByTestId(`todo-title-${id}`);
  }

  /** Кнопка «Удалить» по id: `todo-delete-<id>`. */
  todoDelete(id: number): Locator {
    return this.page.getByTestId(`todo-delete-${id}`);
  }

  /** Строка задачи по её названию (поиск внутри списка). */
  todoByTitle(title: string): Locator {
    return this.list.getByText(title);
  }
}
