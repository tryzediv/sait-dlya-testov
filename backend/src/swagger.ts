import swaggerJSDoc from 'swagger-jsdoc';

/**
 * OpenAPI 3.0 для QA-песочницы.
 * Схемы описываем инлайново здесь, чтобы /api/docs работал уже на старте,
 * а детальные пути допишем в файлах routes/*.ts через JSDoc-аннотации.
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QA Sandbox API',
      version: '0.1.0',
      description:
        'API песочницы для курса автоматизации: todos, products, cart, checkout. Без авторизации (MVP).',
    },
    servers: [{ url: '/', description: 'same origin (proxied to backend)' }],
    tags: [
      { name: 'health', description: 'Проверки живости' },
      { name: 'todos', description: 'To-Do List (CRUD)' },
      { name: 'products', description: 'Каталог магазина' },
      { name: 'cart', description: 'Корзина (singleton, без пользователей)' },
      { name: 'checkout', description: 'Оформление заказа' },
      { name: 'test', description: 'Служебные эндпоинты для E2E (reset-db)' },
    ],
    components: {
      schemas: {
        Todo: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Написать API-тест' },
            completed: { type: 'boolean', example: false },
          },
          required: ['id', 'title', 'completed'],
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Клавиатура' },
            description: { type: 'string', example: 'Механическая, TKL' },
            price: { type: 'number', example: 4999.99 },
            imageUrl: { type: 'string', example: '/api/images/kb.svg' },
            category: { type: 'string', example: 'electronics' },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            productId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 2 },
            product: { $ref: '#/components/schemas/Product' },
            subtotal: { type: 'number', example: 9999.98 },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Validation error' },
            message: { type: 'string', example: 'title is required' },
          },
        },
      },
    },
  },
  // Отсюда swagger-jsdoc подтянет @openapi-комментарии из роутов.
  apis: ['./src/routes/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
