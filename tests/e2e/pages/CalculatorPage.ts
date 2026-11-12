import type { Locator, Page } from "@playwright/test";

/** Операции, доступные в селекторе калькурятора */
export type CalcOperation =  '+' | '-' | '*' | '/';

export class CalculatorPage {
    readonly page: Page;
    readonly tab: Locator;
    readonly firstInput: Locator;
    readonly operationSelect: Locator;
    readonly secondInput: Locator;
    readonly computeButton: Locator;
    readonly result: Locator;
    readonly error: Locator;
    readonly history: Locator;
    readonly historyEmpty: Locator;
    readonly clearHistoryButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.tab = page.getByTestId('tab-calculator');
        this.firstInput = page.getByPlaceholder('Число 1');
        this.operationSelect = page.getByTestId('calc-operation');
        this.secondInput = page.getByPlaceholder('Число 2');
        this.computeButton = page.getByRole('button', { name: 'Вычислить' });
        this.result = page.getByTestId('calc-result');
        this.error = page.locator('p[role="alert"]');
        this.history = page.getByTestId('calc-history');
        this.historyEmpty = page.getByTestId('calc-history-empty');
        this.clearHistoryButton = page.getByRole('button', { name: 'Очистить историю' });
    }

    /** Открывает вкладку без истории прошлых тестов */
    async open(): Promise<void> {
        await this.page.goto('/');
        await this.page.evaluate(() => localStorage.clear());
        await this.page.reload();
        await this.tab.click();
    }

    /** Вводит a, b, выбирает оперцию и жмет "Вычислить" */
    async compute(a: string, b: string, op: CalcOperation): Promise<void> {
        await this.firstInput.fill(a);
        await this.operationSelect.selectOption(op);
        await this.secondInput.fill(b);
        await this.computeButton.click();
    }

    /** Жмет кнопку "Очистить историю" */
    async clearHistory(): Promise<void> {
        await this.clearHistoryButton.click();
    }

    /** Возвращает локатор истории по индексу */
    historyItem(index: number): Locator {
        return this.page.getByTestId(`calc-history-item-${index}`);
    }
}