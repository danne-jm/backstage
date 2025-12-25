export interface Product {
    id: number;
    type: 'product';
    name: string;
    description: string | null;
    price: number;
    quantity?: number | null;
    variable_amount?: boolean;
    quantity_with_card?: number | null;
    quantity_without_card?: number | null;
    remaining: number;
    remaining_with_card?: number;
    remaining_without_card?: number;
    is_online_sellable: boolean;
}

export interface Event {
    id: number;
    type: 'event';
    name: string;
    description: string | null;
    event_date: string;
    start_sell_date: string;
    end_sell_date: string;
    price_with_card: number;
    price_without_card: number;
    quantity: number | null;
    responsible_user_id?: number | null;
    notes: string | null;
    variable_amount: boolean;
    quantity_with_card: number | null;
    quantity_without_card: number | null;
    google_spreadsheet_id?: string | null;
    responsibleUser?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    remaining: number;
    remaining_with_card: number;
    remaining_without_card: number;
    is_online_sellable: boolean;
}

export type Sellable = Product | Event;

export interface BoardUser {
    id: number;
    name: string;
    email: string;
}

export interface OnlineSale {
    id: number;
    product_id?: number | null;
    event_id?: number | null;
    method?: string;
    amount: number;
    details?: any;
    sold_at: string;
    product?: { name?: string };
    event?: { name?: string };
}
