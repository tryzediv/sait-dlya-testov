import {
    calculate,
    DIVISION_BY_ZERO_ERROR,
    parseNumber,
    formatResult,
    safeCalculate,
    toErrorMessage,
    CalcResult,
    Operation
} from '../../frontend/src/calculator/calculate';

describe('calculate', () => {
    describe('Базовые операции', () => {
        // Массив объектов с тестовыми данными
        it.each<{ a: number, b: number, op: Operation, expected: number, desc: string }>([
            { a: 5, b: 3, op: '+', expected: 8, desc: 'Сложение' },
            { a: 5, b: 3, op: '-', expected: 2, desc: 'Вычитание' },
            { a: 5, b: 3, op: '*', expected: 15, desc: 'Умножение' },
            { a: 6, b: 2, op: '/', expected: 3, desc: 'Деление без остатка' },
            { a: 7, b: 3, op: '/', expected: 2.3333333333333335, desc: 'Деление с остатком' },
            { a: -5, b: -3, op: '+', expected: -8, desc: 'Сложение отрицательных чисел' },
            { a: -5, b: -3, op: '-', expected: -2, desc: 'Вычитание отрицательных чисел' },
            { a: -5, b: -3, op: '*', expected: 15, desc: 'Умножение отрицательных чисел' },
            { a: -6, b: -2, op: '/', expected: 3, desc: 'Деление отрицательных чисел без остатка' },
            { a: -7, b: -3, op: '/', expected: 2.3333333333333335, desc: 'Деление отрицательных чисел с остатком' },
        ])(
            // Название теста с подстановкой переменных через $
            'Корректно выполняет $desc: $a $op $b = $expected',
            // Деструктуризация объекта из массива
            ({ a, b, op, expected }) => {
                expect(calculate(a, b, op)).toBe(expected);
            }
        );
    });
});

describe('Негативные тесты', () => {
    it.each<{ a: number, b: number, op: Operation, desc: string }>([
        { a: 5, b: 0, op: '/', desc: 'Деление на ноль' },
        { a: -5, b: 0, op: '/', desc: 'Деление отрицательного числа на ноль' },
        { a: 0, b: 0, op: '/', desc: 'Деление нуля на ноль'}
    ])(
        'Вызывает ошибку при попытке: $desc',
        ({ a, b, op }) => {
            // Проверяем, что функция выбрасывает ожидаемую ошибку
            expect(() => calculate(a, b, op)).toThrow(DIVISION_BY_ZERO_ERROR);
        }
    );

    it('Вызывает ошибку при неподдерживаемой операции (default-ветка)', () => {
        // Тип Operation не позволяет передать левую операцию напрямую,
        // поэтому кастуем через unknown — на практике сюда можно попасть
        // только из JS без типов или после добавления операции в union без case.
        const badOp = '%' as unknown as Operation;
        expect(() => calculate(1, 2, badOp)).toThrow('Unsupported operation: %');
    });
});


describe('parseNumber', () => {
    it.each<{ input: string, expected: number | null, desc: string }>([
        { input: '123', expected: 123, desc: 'Парсинг числа' },
        { input: '0', expected: 0, desc: 'Парсинг нуля' },
        { input: '123.45', expected: 123.45, desc: 'Парсинг числа с десятичной частью' },
        { input: '123,45', expected: 123.45, desc: 'Парсинг числа с запятой в разделителе' },
        { input: '', expected: null, desc: 'Парсинг пустой строки' },
        { input: '     ', expected: null, desc: 'Парсинг пробелов' },
        { input: 'текст', expected: null, desc: 'Парсинг случайной строки' },
    ])(
        'Корректно выполняет $desc: $input: $expected',
        ({ input, expected }) => {
            expect(parseNumber(input)).toBe(expected);
        }
    );
});

describe('safeCalculate', () => {
    it.each<{ a: number, b: number, op: Operation, expected: CalcResult, desc: string }>([
        { a: 5, b: 3, op: '+', expected: { ok: true, value: 8 }, desc: 'Сложение' },
        { a: 5, b: 3, op: '-', expected: { ok: true, value: 2 }, desc: 'Вычитание' },
        { a: 5, b: 3, op: '*', expected: { ok: true, value: 15 }, desc: 'Умножение' },
        { a: 6, b: 2, op: '/', expected: { ok: true, value: 3 }, desc: 'Деление без остатка' },
        { a: 7, b: 3, op: '/', expected: { ok: true, value: 2.3333333333333335 }, desc: 'Деление с остатком' },
    ])(
        'Корректно выполняет $desc: $a $op $b = $expected',
        ({ a, b, op, expected }) => {
            expect(safeCalculate(a, b, op)).toEqual(expected);
        }
    );

    it('Возвращает ошибку вместо throw при делении на ноль (catch-ветка)', () => {
        expect(safeCalculate(5, 0, '/')).toEqual({ ok: false, error: DIVISION_BY_ZERO_ERROR });
    });

    it('Возвращает ошибку вместо throw при неподдерживаемой операции', () => {
        const badOp = '%' as unknown as Operation;
        expect(safeCalculate(1, 2, badOp)).toEqual({ ok: false, error: 'Unsupported operation: %' });
    });
});

describe('toErrorMessage', () => {
    it('Возвращает message для Error', () => {
        expect(toErrorMessage(new Error('boom'))).toBe('boom');
    });

    it.each<{ input: unknown, expected: string, desc: string }>([
        { input: 'строка-ошибка', expected: 'строка-ошибка', desc: 'строка' },
        { input: 42, expected: '42', desc: 'число' },
        { input: undefined, expected: 'undefined', desc: 'undefined' },
    ])(
        'Строкифицирует не-Error значение: $desc',
        ({ input, expected }) => {
            expect(toErrorMessage(input)).toBe(expected);
        }
    );
});

describe('formatResult', () => {

    it('Форматирование числа с 15 знаками после запятой', () => {
        expect(formatResult(0.123456789012345)).toBe('0.123456789012')
    });

    it('Форматирование числа', () => {
        expect(formatResult(123)).toBe('123');
    });

    it('Форматирование числа с десятичной частью', () => {
        expect(formatResult(123.45)).toBe('123.45');
    });
    
    it('Форматирование числа 0', () => {
        expect(formatResult(0)).toBe('0');
    });

    it('Форматирование бесконечности', () => {
        expect(formatResult(Infinity)).toBe('Infinity');
    });

    it('Форматирование минус бесконечности', () => {
        expect(formatResult(-Infinity)).toBe('-Infinity');
    });
});
