import { useState } from 'react';
import { EventPreview } from '@backstage/components/sellables/event-preview';
import { ProductPreview } from '@backstage/components/sellables/product-preview';
import { Button } from '@backstage/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@backstage/components/ui/dialog';
import { PlaceholderPattern } from '@backstage/components/ui/placeholder-pattern';
import type { Event, Product, Sellable } from '@backstage/types/sellables';

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
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingItem, setPendingItem] = useState<{ id: number; isOnline: boolean; type: 'product' | 'event'; name: string } | null>(null);

    const handleSetOnlineClick = (id: number, isOnline: boolean, type?: 'product' | 'event') => {
        const item = sellables.find(s => s.id === id && s.type === type);
        setPendingItem({
            id,
            isOnline,
            type: type || 'product',
            name: item ? item.name : 'this item'
        });
        setConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (pendingItem && onSetOnline) {
            onSetOnline(pendingItem.id, pendingItem.isOnline, pendingItem.type);
        }
        setConfirmOpen(false);
        setPendingItem(null);
    };

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
                                key={`${s.type}-${s.id}`}
                                product={s}
                                onEdit={onEditProduct}
                                variant="store-manager"
                                isOnline={s.is_online_sellable}
                                onSetOnline={handleSetOnlineClick}
                            />
                        ) : (
                            <EventPreview
                                key={`${s.type}-${s.id}`}
                                event={s}
                                onEdit={onEditEvent}
                                variant="store-manager"
                                isOnline={s.is_online_sellable}
                                onSetOnline={handleSetOnlineClick}
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

            {/* Confirmation Modal */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {pendingItem?.isOnline ? 'enable' : 'disable'} online sales for "<strong>{pendingItem?.name}</strong>"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
                        <Button
                            variant={pendingItem?.isOnline ? "default" : "destructive"}
                            onClick={handleConfirm}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
