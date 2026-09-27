import { api } from '../api/client';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export interface CartLine {
  productId: number;
  quantity: number;
  subtotal: number;
  product: Product;
}

export interface Cart {
  items: CartLine[];
  total: number;
}

export interface CheckoutResult {
  orderId: number;
  total: number;
  items: Array<{ id: number; productId: number; quantity: number; price: number }>;
}

export interface ProductQuery {
  category?: string;
  search?: string;
}

/** GET /api/products?category=&search= — пустые значения не отправляем. */
export async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (query.category) params.category = query.category;
  if (query.search) params.search = query.search;
  const { data } = await api.get<Product[]>('/api/products', { params });
  return data;
}

/** GET /api/cart — на бэкенде искусственная задержка ~1.5с (спиннер!). */
export async function fetchCart(): Promise<Cart> {
  const { data } = await api.get<Cart>('/api/cart');
  return data;
}

/** POST /api/cart/items */
export async function addToCart(productId: number, quantity = 1): Promise<Cart> {
  const { data } = await api.post<Cart>('/api/cart/items', { productId, quantity });
  return data;
}

/** PATCH /api/cart/items/:productId */
export async function setCartQuantity(productId: number, quantity: number): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/api/cart/items/${productId}`, { quantity });
  return data;
}

/** DELETE /api/cart/items/:productId */
export async function removeFromCart(productId: number): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/api/cart/items/${productId}`);
  return data;
}

/** POST /api/checkout */
export async function checkout(): Promise<CheckoutResult> {
  const { data } = await api.post<CheckoutResult>('/api/checkout');
  return data;
}

/** Формат цены для витрины: 7 490 ₽ */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU')} ₽`;
}
