import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../pages/CalculatorPage'; 

let calc: CalculatorPage;

test.beforeEach(async ({ page }) => {
  calc = new CalculatorPage(page);
  await calc.open();
});


test.describe('Калькулятор: базовые операции', () => {

  const cases = [
    { a: '2', b: '3', op: '+', expected: '5' },
    { a: '2', b: '3', op: '-', expected: '-1' },
    { a: '3', b: '7', op: '*', expected: '21' },
    { a: '20', b: '5', op: '/', expected: '4' },
    { a: '0.1', b: '0.2', op: '+', expected: '0.3' },
    { a: '0,1', b: '0,2', op: '+', expected: '0.3' },
    { a: '-5', b: '8', op: '+', expected: '3' },
    { a: '5', b: '0', op: '*', expected: '0' },
    { a: '5', b: '2', op: '/', expected: '2.5' },
    { a: '1000000', b: '10', op: '*', expected: '10000000' }
  ] as const;

  for(const { a, b, op, expected } of cases) {
    test(`${a} ${op} ${b} = ${expected}`, async() => {
      await calc.compute(a, b, op)
      await expect(calc.result).toHaveText(expected);
      await expect(calc.error).toBeHidden();
    });
  }
});

test.describe('Ошибки валидации', () => {

  test('пустые поля показывают ошибку', async () => {
    await calc.computeButton.click();
    await expect(calc.error).toHaveText('Введите два валидных числа');
    await expect(calc.result).toBeHidden();
  });

  test('заполнено только первое поле, второе пустое', async () => {
    await calc.firstInput.fill('10');
    await calc.computeButton.click();
    await expect(calc.error).toHaveText('Введите два валидных числа');
    await expect(calc.result).toBeHidden();
  });

  const errorCases = [
    {
      name: 'текст вместо числа показывает ошибку',
      a: 'фыв',
      b: '3',
      op: '+',
      error: 'Введите два валидных числа'
    },

    {
      name:
      'деление на ноль показывает ошибку',
      a: '3',
      b: '0',
      op: '/',
      error: 'На ноль делить нельзя'
    },

    {
      name: 'спец. символы вместо числа показывает ошибку',
      a: '!"№;%:?*()',
      b: '3',
      op: '/',
      error: 'Введите два валидных числа'
    },

    {
      name: 'пробелы вместо числа показывает ошибку',
      a: '  ',
      b: '  ',
      op: '+',
      error: 'Введите два валидных числа'
    }
  ] as const;

  for (const { name, a, b, op, error } of errorCases) {
    test(name, async () => {
      calc.compute(a, b, op);
      await expect(calc.error).toHaveText(error);
      await expect(calc.result).toBeHidden();
    });
  }

  test('ошибка исчезает после успешного вычисления', async () => {
    await calc.compute('5', 'jhg', '+');
    await expect(calc.error).toBeVisible();

    await calc.compute('5', '3', '+');
    await expect(calc.error).toBeHidden();
    await expect(calc.result).toHaveText('8');
  })

});

test.describe('История', () => {

  test('успешное вычисление добавляется в историю', async() => {
    await calc.compute('2', '3', '+');
    await expect(calc.history).toBeVisible();
    await expect(calc.historyItem(0)).toContainText('2 + 3 = 5');
  });

  test('новые вычисления отображаются сверху', async() => {
    await calc.compute('2', '3', '+');
    await calc.compute('2', '3', '-');
    await expect(calc.history).toBeVisible();
    await expect(calc.historyItem(0)).toContainText('2 - 3 = -1');
    await expect(calc.historyItem(1)).toContainText('2 + 3 = 5');
  });

  test('перезагрузка страницы не удаляет историю', async({ page }) => {
    await calc.compute('2', '3', '+');
    await expect(calc.history).toBeVisible();
    await page.reload();
    await expect(calc.historyItem(0)).toContainText('2 + 3 = 5');
  });

  test('кнопка "Очистить историю" удаляет все записи', async() => {
    await calc.compute('2', '3', '+');
    await expect(calc.history).toBeVisible();
    await calc.clearHistoryButton.click();
    await expect(calc.history).not.toBeVisible();
    await expect(calc.historyEmpty).toHaveText('Пока пусто — вычислите что-нибудь.');
  });
});