import { api } from '../../frontend/src/api/client';
// Этот import нужен для того, чтобы получить ссылку на подмененный (замокированный) объект, 
// которым мы затем будем управлять (настраивать возвращаемые значения и проверять факты вызова) 
// внутри наших тестовых сценариев.
import {
  fetchProducts,
  fetchCart,
  addToCart,
  setCartQuantity,
  removeFromCart,
  checkout,
  formatPrice,
  type Product
} from '../../frontend/src/shop/api';

// Подменяем модуль. Теперь api.get, api.post и т.д. — это пустые jest.fn()
jest.mock('../../frontend/src/api/client', () => ({
  api: { 
    get: jest.fn(), 
    post: jest.fn(), 
    patch: jest.fn(), 
    delete: jest.fn() 
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

const product: Product = {
  id: 1,
  name: 'Клавиатура',
  description: 'Механическая',
  price: 7490,
  imageUrl: '/img/kb.png',
  category: 'периферия',
};

afterEach(() => {
  jest.clearAllMocks(); // Сбрасывает историю вызовов всех моков (mock.calls)
});


describe('fetchProducts', () => {
  describe('Успешные запросы', () => {
    beforeAll(() => {
      mockedApi.get.mockResolvedValue({ data: [product] });
    });

    it('без фильтров запрашивает GET /api/products с пустыми params', async () => {
      const result = await fetchProducts();
      expect(result).toEqual([product]);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/products', { params: {} });
    });

    it('передаёт category и search в params', async () => {
      await fetchProducts({ category: 'периферия', search: 'клава' });
      expect(mockedApi.get).toHaveBeenCalledWith('/api/products', {
        params: { category: 'периферия', search: 'клава' },
      });
    });
  });

  describe('Ошибки сервера', () => {
    beforeAll(() => {
      mockedApi.get.mockRejectedValue({ error: 'Server error', message: 'Упал' });
    });
    it('пробрасывает ошибку сервера вызывающему коду', async () => {
      await expect(fetchProducts()).rejects.toEqual({ 
        error: 'Server error', 
        message: 'Упал' 
      });
    });
  });
});


describe('fetchCart', () => {
  it('запрашивает GET /api/cart', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [product], total: 7490 } });
    const result = await fetchCart();
    expect(result).toEqual({ items: [product], total: 7490 });
    expect(mockedApi.get).toHaveBeenCalledWith('/api/cart');
  });
});

describe('addToCart', () => {
  it('отправляет POST /api/cart/items', async () => {
    mockedApi.post.mockResolvedValue({ data: { items: [product], total: 7490 } });
    const result = await addToCart(1);
    expect(result).toEqual({ items: [product], total: 7490 });
    expect(mockedApi.post).toHaveBeenCalledWith('/api/cart/items', { productId: 1, quantity: 1 });
  });
});

describe('setCartQuantity', () => {
  it('отправляет PATCH /api/cart/items/:productId', async () => {
    mockedApi.patch.mockResolvedValue({ data: { items: [product], total: 7490 } });
    const result = await setCartQuantity(1, 2);
    expect(result).toEqual({ items: [product], total: 7490 });
    expect(mockedApi.patch).toHaveBeenCalledWith('/api/cart/items/1', { quantity: 2 });
  });
});

describe('removeFromCart', () => {
  it('отправляет DELETE /api/cart/items/:productId', async () => {
    mockedApi.delete.mockResolvedValue({ data: { items: [product], total: 7490 } });
    const result = await removeFromCart(1);
    expect(result).toEqual({ items: [product], total: 7490 });
    expect(mockedApi.delete).toHaveBeenCalledWith('/api/cart/items/1');
  });
});

describe('checkout', () => {
  it('отправляет POST /api/checkout', async () => {
    mockedApi.post.mockResolvedValue({ data: { orderId: 1, total: 7490, items: [product] } });
    const result = await checkout();
    expect(result).toEqual({ orderId: 1, total: 7490, items: [product] });
    expect(mockedApi.post).toHaveBeenCalledWith('/api/checkout');
  });
});

describe('formatPrice', () => {
  it('форматирует цену в правильном формате', () => {
    expect(formatPrice(7490)).toBe(`${(7490).toLocaleString('ru-RU')} ₽`);
  });

  it('обрабатывает некорректную цену', () => {
    expect(formatPrice(0)).toBe('0 ₽');
  });
});
