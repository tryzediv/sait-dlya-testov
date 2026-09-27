import { useState } from 'react';
import {
  OPERATIONS,
  formatResult,
  parseNumber,
  safeCalculate,
  type Operation,
} from './calculate';

export interface HistoryEntry {
  a: string;
  b: string;
  op: Operation;
  result: string;
}

const HISTORY_KEY = 'qa-sandbox:calc-history';
const HISTORY_LIMIT = 10;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Калькулятор: полностью клиентский, без API.
 * Все интерактивные элементы имеют data-testid для E2E (Playwright/Cypress).
 */
export default function Calculator() {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [op, setOp] = useState<Operation>('+');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  const persistHistory = (next: HistoryEntry[]) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // localStorage может быть недоступен (приватный режим) — история просто не сохранится
    }
  };

  const handleCompute = () => {
    const a = parseNumber(first);
    const b = parseNumber(second);

    if (a === null || b === null) {
      setResult(null);
      setError('Введите два валидных числа');
      return;
    }

    const outcome = safeCalculate(a, b, op);
    if (!outcome.ok) {
      setResult(null);
      // Дружелюбный текст для деления на ноль, остальное — как есть
      setError(
        outcome.error === 'Division by zero'
          ? 'На ноль делить нельзя'
          : outcome.error,
      );
      return;
    }

    const formatted = formatResult(outcome.value);
    setError(null);
    setResult(formatted);
    persistHistory([{ a: first.trim(), b: second.trim(), op, result: formatted }, ...history].slice(0, HISTORY_LIMIT));
  };

  const handleClearHistory = () => {
    persistHistory([]);
  };

  return (
    <section data-testid="calculator-page">
      <h2>Калькулятор</h2>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          data-testid="calc-input-1"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="Число 1"
          inputMode="decimal"
          style={{ padding: 8, width: 140 }}
        />
        <select
          data-testid="calc-operation"
          value={op}
          onChange={(e) => setOp(e.target.value as Operation)}
          style={{ padding: 8 }}
        >
          {OPERATIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <input
          data-testid="calc-input-2"
          value={second}
          onChange={(e) => setSecond(e.target.value)}
          placeholder="Число 2"
          inputMode="decimal"
          style={{ padding: 8, width: 140 }}
        />
        <button data-testid="calc-compute-btn" onClick={handleCompute} style={{ padding: '8px 16px' }}>
          Вычислить
        </button>
      </div>

      {result !== null && (
        <p data-testid="calc-result" style={{ fontSize: 20, fontWeight: 700 }}>
          {result}
        </p>
      )}
      {error !== null && (
        <p data-testid="calc-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <h3>История</h3>
        {history.length === 0 ? (
          <p data-testid="calc-history-empty">Пока пусто — вычислите что-нибудь.</p>
        ) : (
          <>
            <button data-testid="calc-clear-history-btn" onClick={handleClearHistory}>
              Очистить историю
            </button>
            <ul data-testid="calc-history">
              {history.map((h, i) => (
                <li key={`${h.a}${h.op}${h.b}${i}`} data-testid={`calc-history-item-${i}`}>
                  {h.a} {h.op} {h.b} = {h.result}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
