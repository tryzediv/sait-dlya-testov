import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addToCart,
  checkout,
  fetchCart,
  fetchProducts,
  formatPrice,
  removeFromCart,
  setCartQuantity,
  type Cart,
  type Product,
} from './api';
import { useDebouncedValue } from './useDebouncedValue';

const CATEGORIES = [
  { id: '', label: 'Все категории' },
  { id: 'electronics', label: 'Электроника' },
  { id: 'merch', label: 'Мерч' },
  { id: 'books', label: 'Книги' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter((c) => c.id).map((c) => [c.id, c.label]),
);

function categoryLabel(id: string): string {
  return CATEGORY_LABELS[id] ?? id;
}

/**
 * Магазин: витрина + корзина (модалка) + checkout.
 * Ключевые точки для E2E: debounce поиска 300мс, спиннер корзины (~1.5с),
 * счётчик на иконке, модалка с количествами и итогом, экран успеха заказа.
 */
export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Каталог: перезапрос при смене категории или debounced-поиска.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setProductsLoading(true);
      try {
        const list = await fetchProducts({ category, search: debouncedSearch.trim() || undefined });
        if (!cancelled) setProducts(list);
      } catch (e) {
        if (!cancelled) setError(errMsg(e, 'Не удалось загрузить товары'));
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, debouncedSearch]);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      setCart(await fetchCart());
    } catch (e) {
      setError(errMsg(e, 'Не удалось загрузить корзину'));
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Корзину подтягиваем сразу — счётчик на иконке должен быть живым без открытия модалки.
  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const cartCount = useMemo(
    () => (cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  );

  const openCart = () => {
    setOrderId(null);
    setCartOpen(true);
    void loadCart(); // свежие данные + спиннер виден каждый раз
  };

  const handleAdd = async (productId: number) => {
    try {
      setCart(await addToCart(productId, 1));
    } catch (e) {
      setError(errMsg(e, 'Не удалось добавить в корзину'));
    }
  };

  const handleQty = async (productId: number, quantity: number) => {
    try {
      if (quantity <= 0) setCart(await removeFromCart(productId));
      else setCart(await setCartQuantity(productId, quantity));
    } catch (e) {
      setError(errMsg(e, 'Не удалось изменить количество'));
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      setCart(await removeFromCart(productId));
    } catch (e) {
      setError(errMsg(e, 'Не удалось удалить из корзины'));
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const result = await checkout();
      setOrderId(result.orderId);
      setCart({ items: [], total: 0 });
    } catch (e) {
      setError(errMsg(e, 'Не удалось оформить заказ'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section data-testid="shop-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Магазин</h2>
        <button data-testid="cart-icon" onClick={openCart} style={{ padding: '8px 16px', marginLeft: 'auto' }}>
          🛒 Корзина (<span data-testid="cart-count">{cartCount}</span>)
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <select
          data-testid="product-category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 8 }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          data-testid="product-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск товаров"
          style={{ padding: 8, flex: 1, maxWidth: 320 }}
        />
      </div>

      {error !== null && (
        <p data-testid="shop-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {productsLoading && <p data-testid="products-loading">Загрузка товаров…</p>}

      {!productsLoading && products.length === 0 && (
        <p data-testid="products-empty">Ничего не найдено — измените поиск или категорию.</p>
      )}

      <div data-testid="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {products.map((p) => (
          <article
            key={p.id}
            data-testid={`product-card-${p.id}`}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column' }}
          >
            <img
              data-testid={`product-image-${p.id}`}
              src={p.imageUrl}
              alt={p.name}
              width="100%"
              height="140"
              style={{ objectFit: 'cover', borderRadius: 4, background: '#f0f0f0' }}
              loading="lazy"
            />
            <h3 data-testid={`product-name-${p.id}`} style={{ margin: '8px 0 4px' }}>
              {p.name}
            </h3>
            <p data-testid={`product-category-${p.id}`} style={{ margin: '0 0 4px', color: '#888', fontSize: 13 }}>
              {categoryLabel(p.category)}
            </p>
            <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>{p.description}</p>
            <p data-testid={`product-price-${p.id}`} style={{ fontWeight: 700, margin: '0 0 8px' }}>
              {formatPrice(p.price)}
            </p>
            <button
              data-testid={`add-to-cart-${p.id}`}
              onClick={() => void handleAdd(p.id)}
              style={{ padding: '8px 12px', marginTop: 'auto', alignSelf: 'flex-start' }}
            >
              В корзину
            </button>
          </article>
        ))}
      </div>

      {cartOpen && (
        <div
          data-testid="cart-modal"
          role="dialog"
          aria-label="Корзина"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
          onClick={() => setCartOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 8, padding: 20, minWidth: 320, maxWidth: 520, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Корзина</h3>
              <button data-testid="cart-close-btn" onClick={() => setCartOpen(false)} style={{ marginLeft: 'auto' }}>
                Закрыть
              </button>
            </div>

            {cartLoading && <p data-testid="cart-loading">Загрузка корзины…</p>}

            {!cartLoading && orderId !== null && (
              <p data-testid="order-success">
                Заказ оформлен! Номер заказа: <span data-testid="order-id">{orderId}</span>
              </p>
            )}

            {!cartLoading && orderId === null && (cart?.items.length ?? 0) === 0 && (
              <p data-testid="cart-empty">Корзина пуста.</p>
            )}

            {!cartLoading && orderId === null && (cart?.items.length ?? 0) > 0 && (
              <>
                <ul data-testid="cart-items" style={{ listStyle: 'none', padding: 0 }}>
                  {cart!.items.map((line) => (
                    <li
                      key={line.productId}
                      data-testid={`cart-item-${line.productId}`}
                      style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0' }}
                    >
                      <span data-testid={`cart-item-name-${line.productId}`} style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {line.product.name}
                      </span>
                      <button
                        data-testid={`cart-decrease-${line.productId}`}
                        onClick={() => void handleQty(line.productId, line.quantity - 1)}
                        style={{ flexShrink: 0 }}
                      >
                        −
                      </button>
                      <span data-testid={`cart-qty-${line.productId}`} style={{ minWidth: 24, textAlign: 'center', flexShrink: 0 }}>
                        {line.quantity}
                      </span>
                      <button
                        data-testid={`cart-increase-${line.productId}`}
                        onClick={() => void handleQty(line.productId, line.quantity + 1)}
                        style={{ flexShrink: 0 }}
                      >
                        +
                      </button>
                      <span data-testid={`cart-subtotal-${line.productId}`} style={{ minWidth: 90, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(line.subtotal)}
                      </span>
                      <button
                        data-testid={`cart-remove-${line.productId}`}
                        onClick={() => void handleRemove(line.productId)}
                        style={{ flexShrink: 0 }}
                      >
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
                <p data-testid="cart-total" style={{ fontWeight: 700 }}>
                  Итого: {formatPrice(cart!.total)}
                </p>
                <button
                  data-testid="checkout-btn"
                  onClick={() => void handleCheckout()}
                  disabled={checkoutLoading}
                  style={{ padding: '10px 20px' }}
                >
                  {checkoutLoading ? 'Оформляем…' : 'Оформить заказ'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function errMsg(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}
