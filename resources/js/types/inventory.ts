export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    category: string[] | null;
    last_modified: string | null;
    changed_by: string | null;
    image_url: string | null;
}
