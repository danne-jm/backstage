export interface StoreVariant {
    id: string;
    options: Record<string, string>;
    has_stock: boolean;
}

export interface StoreSellable {
    id: string;
    type: 'product' | 'event';
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    has_stock: boolean;
    is_variable: boolean;
    event_date?: string | null;
    member_price?: number | null;
    price_without_card?: number | null;
}

export interface StoreItem extends StoreSellable {
    is_variant_based: boolean;
    variants_config: { name: string; options: string[] }[] | null;
    variants: StoreVariant[];
    has_stock_with_card: boolean;
    has_stock_without_card: boolean;
    instagram_link: string | null;
    images: { id: string; url: string }[];
}
