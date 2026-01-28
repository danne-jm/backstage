export interface VariantConfigItem {
    name: string;
    options: string[];
}

export interface SellableVariant {
    id?: string;
    options: Record<string, string>;
    quantity: number | null;
    sold_count?: number;
}

export interface Product {
    id: number;
    type: 'product';
    name: string;
    description: string | null;
    price: number;
    quantity?: number | null;
    unlimited_quantity?: boolean;
    variable_amount?: boolean;
    quantity_with_card?: number | null;
    unlimited_quantity_with_card?: boolean;
    quantity_without_card?: number | null;
    unlimited_quantity_without_card?: boolean;
    remaining: number;
    remaining_with_card?: number;
    remaining_without_card?: number;
    is_online_sellable: boolean;
    images_list?: { id: number | string; url: string }[];
    instagram_link?: string | null;
    variants_config?: VariantConfigItem[] | null;
    variants?: SellableVariant[] | null;
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
    unlimited_quantity?: boolean;
    responsible_user_id?: number | null;
    notes: string | null;
    variable_amount: boolean;
    quantity_with_card: number | null;
    unlimited_quantity_with_card?: boolean;
    quantity_without_card: number | null;
    unlimited_quantity_without_card?: boolean;
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
    images_list?: { id: number | string; url: string }[];
    instagram_link?: string | null;
    variants_config?: VariantConfigItem[] | null;
    variants?: SellableVariant[] | null;
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
    details?: {
        item_name?: string;
        ticket_type?: string | null;
        code_used?: string | null;
        options?: Record<string, string> | null;
    };
    ticket_type?: string | null;
    sold_at: string;
    product?: { name?: string };
    event?: { name?: string };
}

export interface OfficeSale {
    id: number;
    product_id?: number | null;
    event_id?: number | null;
    method?: string;
    amount: number;
    sold_at: string;
    product?: { name?: string };
    event?: { name?: string };
}
