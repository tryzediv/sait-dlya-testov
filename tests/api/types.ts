export interface Products {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    createdAt: string;
}

export interface Todo {
    id: number;
    title: string;
    completed: boolean;
}

export interface ApiErrors {
    errors: string;
    message?: string;

}

export interface CartProduct {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
}

export interface CartItem {
    productId: number;
    quantity: number;
    subtotal: number;
    product: CartProduct;
}

export interface Cart {
    items: CartItem[];
    total: number;
}

export interface OrderItem {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
}

export interface CheckoutOrder {
    orderId: number;
    total: number;
    items: OrderItem[];
}

export interface Health {
    status: string;
}