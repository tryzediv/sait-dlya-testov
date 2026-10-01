import { describe, expect, it } from 'vitest';
import {
  DIVISION_BY_ZERO_ERROR,
  calculate,
  formatResult,
  parseNumber,
  safeCalculate,
} from './calculate';

// Пример Unit-тестов для курса: студенты дописывают кейсы сюда же.
describe('calculate', () => {
  it('adds numbers', () => {
    expect(calculate(2, 3, '+')).toBe(5);
  });

  it('subtracts numbers', () => {
    expect(calculate(5, 3, '-')).toBe(2);
  });

  it('multiplies numbers', () => {
    expect(calculate(4, 2.5, '*')).toBe(10);
  });

  it('divides numbers', () => {
    expect(calculate(7, 2, '/')).toBe(3.5);
  });

  it('throws on division by zero', () => {
    expect(() => calculate(1, 0, '/')).toThrow(DIVISION_BY_ZERO_ERROR);
  });
});

describe('safeCalculate', () => {
  it('returns error object instead of throwing', () => {
    expect(safeCalculate(1, 0, '/')).toEqual({ ok: false, error: DIVISION_BY_ZERO_ERROR });
  });
});

describe('parseNumber', () => {
  it.each([
    ['42', 42],
    ['  3.14  ', 3.14],
    ['3,14', 3.14], // запятая как разделитель
    ['-7', -7],
  ])('parses %s as %s', (raw, expected) => {
    expect(parseNumber(raw)).toBe(expected);
  });

  it.each(['', '   ', 'abc', 'NaN', 'Infinity', '12px'])('rejects %s', (raw) => {
    expect(parseNumber(raw)).toBeNull();
  });
});

describe('formatResult', () => {
  it('hides float noise (0.1 + 0.2)', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
  });
});
