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
    event_date?: string | null;
    available_from?: string | null;
    // Withheld (null) when available_from is set — item not yet on sale.
    price: number | null;
    has_stock: boolean | null;
    is_variable: boolean | null;
    member_price?: number | null;
    price_without_card?: number | null;
}

export interface StoreItem extends StoreSellable {
    // Withheld (null/[]) when available_from is set.
    is_variant_based: boolean | null;
    variants_config: { name: string; options: string[] }[] | null;
    variants: StoreVariant[];
    has_stock_with_card: boolean | null;
    has_stock_without_card: boolean | null;
    instagram_link: string | null;
    images: { id: string; url: string }[];
}
