import { test, expect, type E2eProduct } from '../fixtures';
import type { ShopPage } from '../pages/ShopPage';

/**
 * E2E: вкладка «Магазин» (витрина + корзина + checkout).
 *
 * Важно про изоляцию: корзина на стенде — синглтон без пользователей,
 * поэтому весь файл идёт серийно (mode: 'serial'), а фикстура shopApi
 * чистит корзину до И после каждого теста (сетап + тирдаун).
 * Товары для сценариев берём из живого каталога (GET /api/products)
 * по именам из сида — id заранее неизвестны.
 *
 * Фикстура shopPage открывает вкладку до теста, сам спек занимается
 * только сценарием.
 */

test.describe.configure({ mode: 'serial' });

/** Первый товар каталога с заданным именем (идёт из сида бэкенда). */
function mustFindProduct(products: E2eProduct[], name: string): E2eProduct {
  const found = products.find((p) => p.name === name);
  if (found === undefined) throw new Error(`товар «${name}» должен быть в каталоге`);
  return found;
}

/** Цена в формате витрины: «7 490 ₽» (неразрывные пробелы нормализуем). */
function priceDigits(text: string | null): string {
  return (text ?? '').replace(/[^\d]/g, '');
}

test.describe('Магазин: витрина', () => {
  test('каталог показывает товары из сида', async ({ shopPage, shopApi }) => {
    const products = await shopApi.products();
    expect(products.length).toBeGreaterThan(0);

    for (const p of products.slice(0, 3)) {
      await expect(shopPage.productCard(p.id)).toBeVisible();
      await expect(shopPage.productName(p.id)).toHaveText(p.name);
    }
  });

  test('фильтр по категории оставляет только её товары', async ({ shopPage, shopApi }) => {
    const products = await shopApi.products();
    const books = products.filter((p) => p.category === 'books');
    expect(books.length).toBeGreaterThan(0);

    await shopPage.selectCategory('books');

    for (const p of books) {
      await expect(shopPage.productCard(p.id)).toBeVisible();
    }
    const others = products.filter((p) => p.category !== 'books');
    for (const p of others.slice(0, 3)) {
      await expect(shopPage.productCard(p.id)).toBeHidden();
    }
  });

  test('поиск находит товар по имени (с учётом debounce 300 мс)', async ({
    shopPage,
  }) => {
    await shopPage.search('клавиатура');

    // Debounce + запрос: ждём автоожиданием, а не sleep.
    await expect(shopPage.productGrid).toContainText('Механическая клавиатура');
    await expect(shopPage.productGrid).not.toContainText('Кружка QA');
  });

  test('поиск без совпадений показывает заглушку', async ({ shopPage }) => {
    await shopPage.search('такого-товара-точно-нет-zzz');

    await expect(shopPage.productsEmpty).toBeVisible();
    await expect(shopPage.productsEmpty).toContainText('Ничего не найдено');
  });

  test('сброс фильтров возвращает весь каталог', async ({ shopPage, shopApi }) => {
    const products = await shopApi.products();

    await shopPage.search('такого-товара-точно-нет-zzz');
    await expect(shopPage.productsEmpty).toBeVisible();

    await shopPage.search('');
    await shopPage.selectCategory('');
    for (const p of products.slice(0, 3)) {
      await expect(shopPage.productCard(p.id)).toBeVisible();
    }
  });

  test('карточка показывает цену товара', async ({ shopPage, shopApi }) => {
    const products = await shopApi.products();
    const keyboard = mustFindProduct(products, 'Механическая клавиатура');

    const priceText = await shopPage.page
      .getByTestId(`product-price-${keyboard.id}`)
      .textContent();
    expect(priceDigits(priceText)).toBe(String(keyboard.price));
  });
});

test.describe('Магазин: корзина', () => {
  /** Открывает модалку и ждёт конца загрузки (спиннер ~1.5 с исчезает). */
  async function openCartReady(shopPage: ShopPage): Promise<void> {
    await shopPage.openCart();
    await expect(shopPage.cartLoading).toBeHidden();
  }

  test('пустая корзина показывает заглушку и счётчик 0', async ({ shopPage }) => {
    await expect(shopPage.cartCount).toHaveText('0');

    await openCartReady(shopPage);

    await expect(shopPage.cartEmpty).toBeVisible();
    await expect(shopPage.cartEmpty).toContainText('Корзина пуста');
  });

  test('кнопка «В корзину» добавляет товар, счётчик растёт', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Кружка QA');

    await shopPage.addToCart(product.id);

    await expect(shopPage.cartCount).toHaveText('1');

    await openCartReady(shopPage);

    await expect(shopPage.cartItem(product.id)).toBeVisible();
    await expect(shopPage.cartQty(product.id)).toHaveText('1');
  });

  test('повторное добавление увеличивает количество, а не дублирует строку', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Кружка QA');

    await shopPage.addToCart(product.id);
    await shopPage.addToCart(product.id);

    await expect(shopPage.cartCount).toHaveText('2');

    await openCartReady(shopPage);

    // Строка одна (дочерний cart-item-name-<id> под этот локатор не попадает).
    await expect(shopPage.cartItem(product.id)).toHaveCount(1);
    await expect(shopPage.cartQty(product.id)).toHaveText('2');
  });

  test('кнопки «+» и «−» меняют количество, «−» до нуля убирает строку', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Игровая мышь');

    await shopPage.addToCart(product.id);
    await openCartReady(shopPage);

    await shopPage.cartIncrease(product.id).click();
    await expect(shopPage.cartQty(product.id)).toHaveText('2');

    await shopPage.cartDecrease(product.id).click();
    await expect(shopPage.cartQty(product.id)).toHaveText('1');

    await shopPage.cartDecrease(product.id).click();
    await expect(shopPage.cartItem(product.id)).toBeHidden();
    await expect(shopPage.cartEmpty).toBeVisible();
  });

  test('кнопка «Удалить» убирает строку из корзины', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Книга «Testing 101»');

    await shopPage.addToCart(product.id);
    await openCartReady(shopPage);
    await expect(shopPage.cartItem(product.id)).toBeVisible();

    await shopPage.cartRemove(product.id).click();

    await expect(shopPage.cartItem(product.id)).toBeHidden();
    await expect(shopPage.cartEmpty).toBeVisible();
  });

  test('итог считается как сумма подытогов строк', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const keyboard = mustFindProduct(products, 'Механическая клавиатура');
    const mug = mustFindProduct(products, 'Кружка QA');

    await shopApi.addToCart(keyboard.id, 1);
    await shopApi.addToCart(mug.id, 2);
    const expectedTotal = keyboard.price * 1 + mug.price * 2;

    await shopPage.page.reload();
    await shopPage.tab.click();
    await openCartReady(shopPage);

    const totalText = await shopPage.cartTotal.textContent();
    expect(priceDigits(totalText)).toBe(String(expectedTotal));
  });

  test('корзина переживает перезагрузку страницы', async ({ page, shopPage, shopApi }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Кружка QA');

    await shopPage.addToCart(product.id);
    await expect(shopPage.cartCount).toHaveText('1');

    await page.reload();
    await shopPage.tab.click();

    // Счётчик подтягивается отдельным GET /api/cart при монтировании.
    await expect(shopPage.cartCount).toHaveText('1');
  });

  test('оформление пустой корзины через API отклоняется (контракт checkout)', async ({
    shopApi,
  }) => {
    await expect(shopApi.checkout()).rejects.toThrow('HTTP 400');
  });
});

test.describe('Магазин: оформление заказа', () => {
  test('checkout оформляет заказ: виден номер, корзина пустеет', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const product = mustFindProduct(products, 'Кружка QA');

    await shopPage.addToCart(product.id);
    await shopPage.openCart();
    await expect(shopPage.cartLoading).toBeHidden();
    await expect(shopPage.cartItem(product.id)).toBeVisible();

    await shopPage.checkoutButton.click();

    await expect(shopPage.orderSuccess).toBeVisible();
    await expect(shopPage.orderId).toHaveText(/\d+/);
    await expect(shopPage.cartCount).toHaveText('0');

    // Сервер тоже очистил корзину: повторный checkout отклоняется.
    await expect(shopApi.checkout()).rejects.toThrow('HTTP 400');
  });

  test('после заказа корзина пуста и готова к новым покупкам', async ({
    shopPage,
    shopApi,
  }) => {
    const products = await shopApi.products();
    const first = mustFindProduct(products, 'Кружка QA');
    const second = mustFindProduct(products, 'Игровая мышь');

    await shopPage.addToCart(first.id);
    await shopPage.openCart();
    await expect(shopPage.cartLoading).toBeHidden();
    await shopPage.checkoutButton.click();
    await expect(shopPage.orderSuccess).toBeVisible();

    await shopPage.closeCart();
    await shopPage.addToCart(second.id);
    await expect(shopPage.cartCount).toHaveText('1');
  });
});
