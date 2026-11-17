import type { Locator, Page } from '@playwright/test';

/**
 * Page Object вкладки «Магазин».
 *
 * Особенности, которые учитывает объект:
 *  - поиск с debounce 300 мс — тесты ждут результата через expect-автоожидание,
 *    а не через sleep;
 *  - GET /api/cart идёт с задержкой ~1.5 с — при открытии модалки виден спиннер
 *    `cart-loading`, объект умеет дожидаться его исчезновения;
 *  - id товаров заранее неизвестны — тесты берут их из API (shopApi-фикстура)
 *    и подставляют в динамические testid (`product-card-<id>`, …).
 */
export class ShopPage {
  readonly page: Page;
  readonly tab: Locator;
  readonly pageSection: Locator;
  readonly cartIcon: Locator;
  readonly cartCount: Locator;
  readonly categoryFilter: Locator;
  readonly searchInput: Locator;
  readonly error: Locator;
  readonly productsLoading: Locator;
  readonly productsEmpty: Locator;
  readonly productGrid: Locator;
  readonly cartModal: Locator;
  readonly cartCloseButton: Locator;
  readonly cartLoading: Locator;
  readonly cartEmpty: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;
  readonly orderSuccess: Locator;
  readonly orderId: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tab = page.getByTestId('tab-shop');
    this.pageSection = page.getByTestId('shop-page');
    this.cartIcon = page.getByTestId('cart-icon');
    this.cartCount = page.getByTestId('cart-count');
    this.categoryFilter = page.getByTestId('product-category-filter');
    this.searchInput = page.getByTestId('product-search');
    this.error = page.getByTestId('shop-error');
    this.productsLoading = page.getByTestId('products-loading');
    this.productsEmpty = page.getByTestId('products-empty');
    this.productGrid = page.getByTestId('product-grid');
    this.cartModal = page.getByTestId('cart-modal');
    this.cartCloseButton = page.getByTestId('cart-close-btn');
    this.cartLoading = page.getByTestId('cart-loading');
    this.cartEmpty = page.getByTestId('cart-empty');
    this.cartItems = page.getByTestId('cart-items');
    this.cartTotal = page.getByTestId('cart-total');
    this.checkoutButton = page.getByTestId('checkout-btn');
    this.orderSuccess = page.getByTestId('order-success');
    this.orderId = page.getByTestId('order-id');
  }

  /** Открывает вкладку с главной страницы и ждёт появления витрины. */
  async open(): Promise<void> {
    await this.page.goto('/');
    await this.tab.click();
    await this.pageSection.waitFor();
  }

  /**
   * Открывает модалку корзины и ждёт окончания загрузки
   * (спиннер `cart-loading` появился и исчез).
   */
  async openCart(): Promise<void> {
    await this.cartIcon.click();
    await this.cartModal.waitFor();
  }

  /** Закрывает модалку корзины. */
  async closeCart(): Promise<void> {
    await this.cartCloseButton.click();
  }

  /** Кликает «В корзину» у товара с заданным id. */
  async addToCart(productId: number): Promise<void> {
    await this.addToCartButton(productId).click();
  }

  /** Выбирает категорию в фильтре витрины. */
  async selectCategory(categoryId: string): Promise<void> {
    await this.categoryFilter.selectOption(categoryId);
  }

  /** Вводит поисковый запрос (результат придёт после debounce 300 мс). */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /** Карточка товара: `product-card-<id>`. */
  productCard(id: number): Locator {
    return this.page.getByTestId(`product-card-${id}`);
  }

  /** Название товара в карточке: `product-name-<id>`. */
  productName(id: number): Locator {
    return this.page.getByTestId(`product-name-${id}`);
  }

  /** Кнопка «В корзину» у товара: `add-to-cart-<id>`. */
  addToCartButton(id: number): Locator {
    return this.page.getByTestId(`add-to-cart-${id}`);
  }

  /** Строка корзины: `cart-item-<productId>`. */
  cartItem(productId: number): Locator {
    return this.page.getByTestId(`cart-item-${productId}`);
  }

  /** Количество в строке корзины: `cart-qty-<productId>`. */
  cartQty(productId: number): Locator {
    return this.page.getByTestId(`cart-qty-${productId}`);
  }

  /** Подытог строки корзины: `cart-subtotal-<productId>`. */
  cartSubtotal(productId: number): Locator {
    return this.page.getByTestId(`cart-subtotal-${productId}`);
  }

  /** Кнопка «+» в строке корзины: `cart-increase-<productId>`. */
  cartIncrease(productId: number): Locator {
    return this.page.getByTestId(`cart-increase-${productId}`);
  }

  /** Кнопка «−» в строке корзины: `cart-decrease-<productId>`. */
  cartDecrease(productId: number): Locator {
    return this.page.getByTestId(`cart-decrease-${productId}`);
  }

  /** Кнопка «Удалить» в строке корзины: `cart-remove-<productId>`. */
  cartRemove(productId: number): Locator {
    return this.page.getByTestId(`cart-remove-${productId}`);
  }
}
