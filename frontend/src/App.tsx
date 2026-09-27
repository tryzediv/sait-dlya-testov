import { useState } from 'react';
import Calculator from './calculator/Calculator';
import Todos from './todos/Todos';
import Shop from './shop/Shop';

type TabId = 'calculator' | 'todos' | 'shop';

const TABS: Array<{ id: TabId; label: string; testid: string }> = [
  { id: 'calculator', label: 'Калькулятор', testid: 'tab-calculator' },
  { id: 'todos', label: 'To-Do List', testid: 'tab-todos' },
  { id: 'shop', label: 'Магазин', testid: 'tab-shop' },
];

/**
 * Каркас SPA: три таба песочницы.
 * Навигация — локальным состоянием (роутер не нужен для MVP без авторизации).
 */
export default function App() {
  const [active, setActive] = useState<TabId>('calculator');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <header>
        <h1 data-testid="app-title">QA Sandbox</h1>
        <p style={{ color: '#555' }}>
          Песочница курса автоматизации: Unit (калькулятор), API + простые E2E (todos), сложные E2E (магазин).
        </p>
        <nav data-testid="main-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={t.testid}
              onClick={() => setActive(t.id)}
              aria-selected={active === t.id}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: active === t.id ? 700 : 400,
                border: active === t.id ? '2px solid #333' : '1px solid #ccc',
                borderRadius: 6,
                background: active === t.id ? '#eee' : '#fff',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main data-testid="tab-content">
        {active === 'calculator' && <Calculator />}
        {active === 'todos' && <Todos />}
        {active === 'shop' && <Shop />}
      </main>
    </div>
  );
}
