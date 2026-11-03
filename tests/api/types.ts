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
