import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId('tab-calculator').click();
});

async function compute(
  page: Page,
  a: string,
  b: string,
  op: '+' | '-' | '*' | '/',
): Promise<void> {
  await page.getByPlaceholder('Число 1').fill(a);
  await page.getByTestId('calc-operation').selectOption(op);
  await page.getByPlaceholder('Число 2').fill(b);
  await page.getByRole('button', { name: 'Вычислить' }).click();
}

test.describe('Калькулятор: базовые операции', () => {

  const cases = [
    { a: '2', b: '3', op: '+', expected: '5' },
    { a: '2', b: '3', op: '-', expected: '-1' },
    { a: '3', b: '7', op: '*', expected: '21' },
    { a: '20', b: '5', op: '/', expected: '4' },
    { a: '0.1', b: '0.2', op: '+', expected: '0.3' },
    { a: '0,1', b: '0,2', op: '+', expected: '0.3' },
    { a: '-5', b: '8', op: '+', expected: '3' },
  ] as const;

  for(const { a, b, op, expected } of cases) {
    test(`${a} ${op} ${b} = ${expected}`, async({ page }) => {
      await compute(page, a, b, op);
      await expect(page.getByTestId('calc-result')).toHaveText(expected);
      await expect(page.locator('p[role="alert"]')).toBeHidden();
    });
  }
});

test.describe('Ошибки валидации', () => {

  test('пустые поля показывают ошибку', async ({ page }) => {
    await page.getByRole('button', { name: 'Вычислить' }).click();
    await expect(page.locator('p[role="alert"]')).toHaveText('Введите два валидных числа');
    await expect(page.getByTestId('calc-result')).toBeHidden();
  });

  test('текст вместо числа показывает ошибку', async({ page }) => {
    await compute(page, 'фыв', '3', '/');
    await expect(page.locator('p[role="alert"]')).toHaveText('Введите два валидных числа');
    await expect(page.getByTestId('calc-result')).toBeHidden();
  });

  test('деление на ноль показывает ошибку', async({ page }) => {
    await compute(page, '3', '0', '/');
    await expect(page.locator('p[role="alert"]')).toHaveText('На ноль делить нельзя');
    await expect(page.getByTestId('calc-result')).toBeHidden();
  });
});

test.describe('История', () => {

  test('успешное вычисление добавляется в историю', async({ page }) => {
    await compute(page, '2', '3', '+');
    await expect(page.getByTestId('calc-history')).toBeVisible();
    await expect(page.getByTestId('calc-history-item-0')).toContainText('2 + 3 = 5');
  });

  test('новые вычисления отображаются сверху', async({ page }) => {
    await compute(page, '2', '3', '+');
    await compute(page, '2', '3', '-');
    await expect(page.getByTestId('calc-history')).toBeVisible();
    await expect(page.getByTestId('calc-history-item-0')).toContainText('2 - 3 = -1');
    await expect(page.getByTestId('calc-history-item-1')).toContainText('2 + 3 = 5');
  });

  test('перезагрузка страницы не удаляет историю', async({ page }) => {
    await compute(page, '2', '3', '+');
    await expect(page.getByTestId('calc-history')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('calc-history-item-0')).toContainText('2 + 3 = 5');
  });

  test('кнопка "Очистить историю" удаляет все записи', async({ page }) => {
    await compute(page, '2', '3', '+');
    await expect(page.getByTestId('calc-history')).toBeVisible();
    await page.getByRole('button', { name: 'Очистить историю' }).click();
    await expect(page.getByTestId('calc-history')).not.toBeVisible();
    await expect(page.getByTestId('calc-history-empty')).toHaveText('Пока пусто — вычислите что-нибудь.');
  })
});