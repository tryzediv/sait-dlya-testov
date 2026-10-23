import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Стартовый каталог — картинки раздаются самим бэкендом
// (backend/public/images → GET /api/images/*.svg), внешних зависимостей нет.
const IMAGE_BASE = '/api/images';
const PRODUCTS = [
  { name: 'Механическая клавиатура', description: 'TKL, hot-swap', price: 7490, imageUrl: `${IMAGE_BASE}/kb.svg`, category: 'electronics' },
  { name: 'Игровая мышь', description: '16000 DPI, 68 г', price: 3490, imageUrl: `${IMAGE_BASE}/mouse.svg`, category: 'electronics' },
  { name: 'Кружка QA', description: '«It works on my machine»', price: 990, imageUrl: `${IMAGE_BASE}/mug.svg`, category: 'merch' },
  { name: 'Футболка «Bug Hunter»', description: 'Хлопок, чёрная', price: 1990, imageUrl: `${IMAGE_BASE}/shirt.svg`, category: 'merch' },
  { name: 'Книга «Testing 101»', description: 'Unit, API, E2E', price: 2490, imageUrl: `${IMAGE_BASE}/book.svg`, category: 'books' },
  { name: 'Коврик для мыши XL', description: '900×400, прошитый край', price: 1490, imageUrl: `${IMAGE_BASE}/pad.svg`, category: 'electronics' },
];

async function main(): Promise<void> {
  const count = await prisma.product.count();
  if (count > 0) {
    // Обновляем картинки у существующих товаров (переход на локальные файлы).
    for (const p of PRODUCTS) {
      await prisma.product.updateMany({ where: { name: p.name }, data: { imageUrl: p.imageUrl } });
    }
    console.log(`[seed] updated imageUrl for ${PRODUCTS.length} products`);
    return;
  }
  await prisma.product.createMany({ data: PRODUCTS });
  console.log(`[seed] inserted ${PRODUCTS.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
