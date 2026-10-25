/**
 * Чистые функции калькулятора.
 * Вынесены в отдельный модуль специально для Unit-тестов:
 * никакого React, DOM и сети — только входные аргументы и возврат.
 */

export type Operation = '+' | '-' | '*' | '/';

export const OPERATIONS: readonly Operation[] = ['+', '-', '*', '/'] as const;

export const DIVISION_BY_ZERO_ERROR = 'Division by zero';

/** Базовая арифметика. При делении на ноль — бросает Error (кейс для Unit-теста). */
export function calculate(a: number, b: number, op: Operation): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      if (b === 0) {
        throw new Error(DIVISION_BY_ZERO_ERROR);
      }
      return a / b;
    default:
      // исчерпывающая проверка: если добавят операцию и забудут case — упадёт на типах
      throw new Error(`Unsupported operation: ${String(op)}`);
  }
}

/** Безопасная обёртка для UI: вместо throw возвращает discriminated union. */
export type CalcResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Нормализация пойманного значения в строку ошибки.
 * Отдельная функция, чтобы обе ветки (Error / не-Error) покрывались
 * прямыми Unit-тестами: через safeCalculate поймать не-Error нельзя —
 * calculate бросает только Error.
 */
export function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function safeCalculate(a: number, b: number, op: Operation): CalcResult {
  try {
    return { ok: true, value: calculate(a, b, op) };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

/**
 * Парсинг текстового инпута в число.
 * Возвращает null, если ввод не является валидным числом.
 * Принимает и точку, и запятую как десятичный разделитель («3,14»).
 */
export function parseNumber(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return value;
}

/**
 * Форматирование результата: убирает шум float-арифметики.
 * Пример: 0.1 + 0.2 → 0.30000000000000004 → «0.3».
 * Отдельная функция = отдельный лёгкий Unit-тест.
 */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  // toPrecision(12) хватает для школьной точности, parseFloat убирает хвостовые нули
  return String(parseFloat(value.toPrecision(12)));
}
