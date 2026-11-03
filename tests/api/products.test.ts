import { apiClient } from './client';

const client = apiClient;

describe('GET /api/products', () => {

  it('возвращает статус 200 и список продуктов', async () => {
    const res = await client.get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('товары имеют ожидаемую структуру', async () => {
    const res = await client.get('/api/products');
    expect(res.status).toBe(200);
    for (const p of res.data) {
        expect(p).toEqual(expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            description: expect.any(String),
            price: expect.any(Number),
            imageUrl: expect.any(String),
            category: expect.any(String),
            createdAt: expect.any(String)
        }));
        expect(p.price).toBeGreaterThan(0);
    }
  })

  it('фильтрует по категории', async () => {
    const res = await client.get('/api/products', { params: { category: 'books' } });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
    for (const p of res.data) {
      expect(p.category).toBe('books');
    }
  });

  it.each(['мышь', 'МЫШЬ', 'край', 'Прошитый'])('регистронезависимо ищет по "%s"', async (search) => {
    const res = await client.get('/api/products', { params: { search } });
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
    for (const p of res.data) {
      const haystack = `${p.name} ${p.description}`.toLowerCase();
      expect(haystack).toContain(search.toLowerCase());
    }
  });
});

describe('GET /api/products/:id', () => {
  it('возвращает товар по существующему id', async () => {
    const list = await client.get('/api/products');
    expect(list.status).toBe(200);
    expect(list.data.length).toBeGreaterThan(0);

    const first = list.data[0];
    const res = await client.get(`/api/products/${first.id}`);
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: first.id,
      name: first.name,
      description: first.description,
      price: first.price,
      imageUrl: first.imageUrl,
      category: first.category,
      createdAt: first.createdAt
    });
  });

  it('возвращает статус 404 для отсутсвующего продукта', async () => {
    const res = await client.get('/api/products/999999');
    expect(res.status).toBe(404);
    expect(res.data).toHaveProperty('error', 'Not found');
  });

  it('возвращает статус 400 для невалидного id', async () => {
    const res = await client.get('/api/products/abc');
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error', 'Validation error');
  });
});
