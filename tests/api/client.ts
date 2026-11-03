import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { Products, Todo } from './types';

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
