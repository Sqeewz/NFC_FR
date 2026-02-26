export interface Product {
    id: number;
    name: string;
    category?: string;
    price: string | number;
    image_url?: string;
    is_available: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Table {
    id: number;
    table_number: string;
    status: string;
    current_session_token?: string;
}

export interface Order {
    id: number;
    items: string[];
    status: string;
    time: string;
}
