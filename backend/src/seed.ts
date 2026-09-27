import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Стартовый каталог — картинки через picsum (не храним бинарники в репо).
const PRODUCTS = [
  { name: 'Механическая клавиатура', description: 'TKL, hot-swap', price: 7490, imageUrl: 'https://picsum.photos/seed/qa-kb/400/300', category: 'electronics' },
  { name: 'Игровая мышь', description: '16000 DPI, 68 г', price: 3490, imageUrl: 'https://picsum.photos/seed/qa-mouse/400/300', category: 'electronics' },
  { name: 'Кружка QA', description: '«It works on my machine»', price: 990, imageUrl: 'https://picsum.photos/seed/qa-mug/400/300', category: 'merch' },
  { name: 'Футболка «Bug Hunter»', description: 'Хлопок, чёрная', price: 1990, imageUrl: 'https://picsum.photos/seed/qa-shirt/400/300', category: 'merch' },
  { name: 'Книга «Testing 101»', description: 'Unit, API, E2E', price: 2490, imageUrl: 'https://picsum.photos/seed/qa-book/400/300', category: 'books' },
  { name: 'Коврик для мыши XL', description: '900×400, прошитый край', price: 1490, imageUrl: 'https://picsum.photos/seed/qa-pad/400/300', category: 'electronics' },
];

async function main(): Promise<void> {
  const count = await prisma.product.count();
  if (count > 0) {
    console.log(`[seed] products already exist (${count}), skip`);
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
