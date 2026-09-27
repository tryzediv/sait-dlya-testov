import { useEffect, useState } from 'react';

/**
 * Debounce для поиска товаров (300 мс по ТЗ).
 * Отдельный хук = легко тестировать + переиспользовать.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
