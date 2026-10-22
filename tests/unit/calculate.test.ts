import { calculate, DIVISION_BY_ZERO_ERROR, parseNumber, formatResult} from '../../frontend/src/calculator/calculate';


describe('calculate', () => {
    
    describe('Базовые операции', () => {

    it('Сложение двух чисел', () => {
        expect(calculate(5, 3, '+')).toBe(8)
    });

    it('Вычитание двух чисел', () => {
        expect(calculate(5, 3, '-')).toBe(2)
    });

    it('Умножение двух чисел', () => {
        expect(calculate(5, 3, '*')).toBe(15)
    });
    
    it('Деление двух чисел', () => {
        expect(calculate(6, 2, '/')).toBe(3)
    });

    it('Деление двух чисел с остатком', () => {
        expect(calculate(7, 3, '/')).toBe(2.3333333333333335)
    });
});

    describe('Негативные тесты', () => {

        it('Деление на ноль вызовет ошибку', () => {
            expect(() => calculate(5, 0, '/')).toThrow(DIVISION_BY_ZERO_ERROR)
        });

        it('Сложение отрицательных чисел', () => {
            expect(calculate(-5, -3, '+')).toBe(-8)
        }
        )
    });

});

describe('parseNumber', () => {

    it('Парсинг числа', () => {
        expect(parseNumber('123')).toBe(123)
    });

    it('Парсинг нуля', () => {
        expect(parseNumber('0')).toBe(0)
    });

    it('Парсинг числа с десятичной частью', () => {
        expect(parseNumber('123.45')).toBe(123.45)
    });

    it('Парсинг числа с запятой в разделителе', () => {
        expect(parseNumber('123,45')).toBe(123.45)
    });

    it('Парсинг пустой строки', () => {
        expect(parseNumber('')).toBeNull()
    });

    it('Парсинг пробелов', () => {
        expect(parseNumber('     ')).toBeNull()
    });

    it('Парсинг случайной строки', () => {
        expect(parseNumber('текст')).toBeNull()
    });
    
});

describe('formatResult', () => {

    it('Форматирование числа с 15 знаками после запятой', () => {
        expect(formatResult(0.123456789012345)).toBe('0.123456789012')
    });

    it('Форматирование числа', () => {
        expect(formatResult(123)).toBe('123')
    });

    it('Форматирование числа с десятичной частью', () => {
        expect(formatResult(123.45)).toBe('123.45')
    });
    
    it('Форматирование числа 0', () => {
        expect(formatResult(0)).toBe('0')
    });
});