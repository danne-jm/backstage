import { router } from '@inertiajs/react';
import * as React from 'react';
import type { InventoryItem } from '@backstage/types/inventory';

type SortColumn = keyof InventoryItem | null;
type SortDir = 'asc' | 'desc';

interface UseInventoryOptions {
    initialItems: InventoryItem[];
}

/**
 * Manages local inventory state: realtime Echo updates, optimistic quantity
 * adjustments, client-side search/sort, and CRUD dialog coordination.
 */
export function useInventory({ initialItems }: UseInventoryOptions) {
    const [realtimeQuantities, setRealtimeQuantities] = React.useState<
        Record<string, number>
    >({});
    const [createdItems, setCreatedItems] = React.useState<InventoryItem[]>([]);
    const [deletedIds, setDeletedIds] = React.useState<string[]>([]);
    const [optimisticQuantities, setOptimisticQuantities] = React.useState<
        Record<string, number>
    >({});
    const [processingIds, setProcessingIds] = React.useState<string[]>([]);

    const [search, setSearch] = React.useState('');
    const [sort, setSort] = React.useState<{
        column: SortColumn;
        dir: SortDir;
    }>({
        column: null,
        dir: 'asc',
    });

    // ── Realtime ───────────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private('inventory');

        channel.listen('InventoryUpdated', (e: any) => {
            if (e.type === 'item') {
                setRealtimeQuantities((prev) => ({
                    ...prev,
                    [e.sellableId]: e.remaining,
                }));
            } else if (e.type === 'item_created' && e.payload) {
                setCreatedItems((prev) => {
                    if (prev.find((p) => p.id === e.payload.id)) return prev;
                    return [e.payload, ...prev];
                });
            } else if (e.type === 'item_deleted') {
                setDeletedIds((prev) => {
                    if (prev.includes(e.sellableId)) return prev;
                    return [...prev, e.sellableId];
                });
            }
        });

        return () => {
            window.Echo?.leave('inventory');
        };
    }, []);

    // ── Derived items list ─────────────────────────────────────────────────────
    const items = React.useMemo(() => {
        const all = [
            ...initialItems.filter(
                (i) => !createdItems.find((c) => c.id === i.id),
            ),
            ...createdItems,
        ];

        return all
            .filter((item) => !deletedIds.includes(item.id))
            .map((item) => ({
                ...item,
                quantity:
                    optimisticQuantities[item.id] ??
                    realtimeQuantities[item.id] ??
                    item.quantity,
            }));
    }, [
        initialItems,
        createdItems,
        deletedIds,
        optimisticQuantities,
        realtimeQuantities,
    ]);

    const filteredItems = React.useMemo(() => {
        const filtered = items.filter((item) => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                item.name.toLowerCase().includes(s) ||
                (item.category ?? []).some((c) =>
                    c.toLowerCase().includes(s),
                ) ||
                (item.changed_by ?? '').toLowerCase().includes(s) ||
                String(item.quantity).includes(s)
            );
        });

        return [...filtered].sort((a, b) => {
            if (!sort.column) return b.id.localeCompare(a.id);

            if (sort.column === 'category') {
                const strA = (a.category ?? []).join(', ');
                const strB = (b.category ?? []).join(', ');
                return sort.dir === 'asc'
                    ? strA.localeCompare(strB)
                    : strB.localeCompare(strA);
            }

            const valA = a[sort.column];
            const valB = b[sort.column];

            if (valA === valB) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;

            const cmp = valA < valB ? -1 : 1;
            return sort.dir === 'asc' ? cmp : -cmp;
        });
    }, [items, search, sort]);

    // ── Sort toggle ────────────────────────────────────────────────────────────
    const toggleSort = (column: NonNullable<SortColumn>) => {
        setSort((prev) => ({
            column,
            dir: prev.column === column && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const clearFilters = () => {
        setSearch('');
        setSort({ column: null, dir: 'asc' });
    };

    // ── Optimistic quantity ────────────────────────────────────────────────────
    const changeQuantity = (item: InventoryItem, delta: number) => {
        const current =
            optimisticQuantities[item.id] ??
            realtimeQuantities[item.id] ??
            item.quantity;
        const next = current + delta;
        if (next < 0) return;

        setOptimisticQuantities((prev) => ({ ...prev, [item.id]: next }));
        setProcessingIds((prev) => [...prev, item.id]);

        const endpoint =
            delta > 0
                ? `/inventory/items/${item.id}/increment`
                : `/inventory/items/${item.id}/decrement`;

        const rollback = () => {
            setOptimisticQuantities((prev) => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
        };

        const finish = () => {
            setProcessingIds((prev) => prev.filter((id) => id !== item.id));
            setOptimisticQuantities((prev) => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
        };

        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onError: rollback,
                onFinish: finish,
            },
        );
    };

    return {
        filteredItems,
        search,
        setSearch,
        sort,
        toggleSort,
        clearFilters,
        changeQuantity,
        processingIds,
    };
}
