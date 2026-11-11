import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { Products, Todo, Cart, CheckoutOrder, Health } from './types';
import { api } from '../../frontend/src/api/client';

export const apiClient: AxiosInstance = axios.create({
    baseURL: 'http://195.63.138.24:4000',
    timeout: 5000,
    validateStatus: () => true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

export const productsApi = {
    getAll: (config?: AxiosRequestConfig) => apiClient.get<Products[]>('/api/products', config),
    getById: (id: number) => apiClient.get<Products>(`/api/products/${id}`),
    getByIdRaw: (id: unknown) => apiClient.get<Products>(`/api/products/${id}`)
}

export const todosApi = {
    get: (config?: AxiosRequestConfig) => apiClient.get<Todo[]>('/api/todos', config),
    create: (data: { title: string }) => apiClient.post<Todo>('/api/todos', data),
    update: (id: number, data: Partial<Todo>) => apiClient.patch<Todo>(`/api/todos/${id}`, data),
    delete: (id: number) => apiClient.delete(`/api/todos/${id}`),

    createRaw: (data: unknown) => apiClient.post<Todo>('/api/todos', data),
    updateRaw: (id: unknown, data: unknown) => apiClient.patch<Todo>(`/api/todos/${id}`, data),
    deleteRaw: (id: unknown) => apiClient.delete(`/api/todos/${id}`)
}

export const cartApi = {
    // Получение содержимого корзины
    get: () => apiClient.get<Cart>('/api/cart'),
    // Добавление товара. quantity опционален (по умолчанию часто равен 1)
    add: (productId: number, quantity?: number) =>
        apiClient.post<Cart>('/api/cart/items', quantity === undefined ? { productId } : { productId, quantity }),
    // "Сырой" метод для отправки невалидных данных (обходит строгую типизацию TypeScript)
    addRaw: (data: unknown) => apiClient.post<Cart>('/api/cart/items', data),
    // Изменение количества товара
    update: (productId: number, quantity: number) =>
        apiClient.patch<Cart>(`/api/cart/items/${productId}`, { quantity }),
    // "Сырой" метод для тестирования невалидных ID или body
    updateRaw: (productId: unknown, data: unknown) =>
        apiClient.patch<Cart>(`/api/cart/items/${productId}`, data),
    // Удаление товара из корзины
    remove: (productId: number) => apiClient.delete<Cart>(`/api/cart/items/${productId}`),
    // "Сырой" метод для проверки невалидных ID в URL
    removeRaw: (productId: unknown) => apiClient.delete<Cart>(`/api/cart/items/${productId}`),
};

export const checkoutApi = {
    // Оформление заказа (создание заказа из текущей корзины)
    create: () => apiClient.post<CheckoutOrder>('/api/checkout'),
};


export const healthApi = {
    get: () => apiClient.get<Health>('/api/health'),
}
