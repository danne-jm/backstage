import { EventPreview } from '@/components/sellables/event-preview';
import { ProductPreview } from '@/components/sellables/product-preview';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import type { Event, Product, Sellable } from '@/types/sellables';

export interface SellablesPanelProps {
    sellables: Sellable[];
    loading: boolean;
    onlineSellablesCount: number;
    onEditProduct: (product: Product) => void;
    onEditEvent: (event: Event) => void;
    onSetOnline?: (
        id: number,
        isOnline: boolean,
        type?: 'product' | 'event',
    ) => void;
}

export function SellablesPanel({
    sellables,
    loading,
    onlineSellablesCount,
    onEditProduct,
    onEditEvent,
    onSetOnline,
}: SellablesPanelProps) {
    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="mb-2 flex shrink-0 items-center justify-between">
                <h3 className="text-sm font-semibold">Sellables</h3>
                <div className="text-xs text-muted-foreground">
                    {onlineSellablesCount} purchasable online
                </div>
            </div>

            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <div className="flex-1 space-y-2 overflow-y-auto">
                    {sellables.map((s) =>
                        s.type === 'product' ? (
                            <ProductPreview
                                key={s.id}
                                product={s}
                                onEdit={onEditProduct}
                                variant="store-manager"
                                isOnline={s.is_online_sellable}
                                onSetOnline={onSetOnline}
                            />
                        ) : (
                            <EventPreview
                                key={s.id}
                                event={s}
                                onEdit={onEditEvent}
                                variant="store-manager"
                                isOnline={s.is_online_sellable}
                                onSetOnline={onSetOnline}
                            />
                        ),
                    )}
                    {sellables.length === 0 && (
                        <div className="text-xs text-muted-foreground">
                            No data yet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
