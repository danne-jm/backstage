import CreateItemDialog from '@/Components/Backstage/warehouse/CreateItemDialog';
import DeleteItemDialog from '@/Components/Backstage/warehouse/DeleteItemDialog';
import EditItemDialog from '@/Components/Backstage/warehouse/EditItemDialog';
import { Button } from '@/Components/Shared/ui/button';
import { Input } from '@/Components/Shared/ui/input';
import AppLayout from '@/layouts/Backstage/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronDownIcon,
    ChevronUpIcon,
    Minus,
    Pencil,
    Plus,
    Search,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

type Item = {
    id: number;
    name: string;
    quantity: number;
    category: string[] | null;
    last_modified: string | null;
    changed_by: string | null;
    image_url?: string | null;
};

// Lazy loaded image component
function LazyImage({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px' },
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className={className}>
            {isInView ? (
                <img
                    src={src}
                    alt={alt}
                    className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsLoaded(true)}
                    loading="lazy"
                />
            ) : (
                <div className={`${className} animate-pulse bg-muted`} />
            )}
        </div>
    );
}

export default function Warehouse() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inventory',
            href: route('warehouse'),
        },
    ];

    const { items: paginatedItems, auth } = usePage().props as unknown as {
        items: any;
        auth: any;
    };

    // Use a ref to track realtime updates
    const [realtimeUpdates, setRealtimeUpdates] = useState<
        Record<number, number>
    >({});
    const [createdItems, setCreatedItems] = useState<Item[]>([]);
    const [deletedIds, setDeletedIds] = useState<number[]>([]);

    // Derive localItems from props and apply realtime updates
    const localItems = React.useMemo(() => {
        const baseItems = paginatedItems?.data || [];
        // Merge base items with created items
        const allItems = [...baseItems, ...createdItems];

        // We use a Map to ensure ID uniqueness if an item is created then paginated to
        // Deduplicate by ID
        const uniqueItems = Array.from(
            new Map(allItems.map((item) => [item.id, item])).values(),
        );

        return uniqueItems
            .filter((item: Item) => !deletedIds.includes(item.id))
            .map((item: Item) => ({
                ...item,
                quantity: realtimeUpdates[item.id] ?? item.quantity,
            }));
    }, [paginatedItems, realtimeUpdates, createdItems, deletedIds]);

    // Realtime updates via Reverb
    useEffect(() => {
        if (!window.Echo) return undefined;
        const channel = window.Echo.private('inventory');
        channel.listen('InventoryUpdated', (e: any) => {
            if (e.type === 'item') {
                setRealtimeUpdates((prev) => ({
                    ...prev,
                    [e.sellableId]: e.remaining,
                }));
            } else if (e.type === 'item_created' && e.payload) {
                setCreatedItems((prev) => {
                    // check if we already have it in state
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

    const permissions = auth.user?.permissions || [];
    const canCreate =
        permissions.includes('admin') || permissions.includes('create_item');
    const canUpdate =
        permissions.includes('admin') || permissions.includes('update_item');
    const canDelete =
        permissions.includes('admin') || permissions.includes('delete_item');

    const props = usePage().props as any;
    const categoriesProp: string[] = props.categories || [];

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<{
        column: keyof Item | null;
        dir: 'asc' | 'desc';
    }>({
        column: null,
        dir: 'asc',
    });

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const [processingIds, setProcessingIds] = useState<number[]>([]);
    const [optimisticQuantities, setOptimisticQuantities] = useState<
        Record<number, number>
    >({});

    const openCreate = () => setCreateOpen(true);

    const openEditFor = (item: Item) => {
        setSelectedItem(item);
        setEditOpen(true);
    };

    const openDeleteFor = (item: Item) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    const changeQuantity = (item: Item, delta: number) => {
        const newQty = (optimisticQuantities[item.id] ?? item.quantity) + delta;
        if (newQty < 0) return;

        setOptimisticQuantities((prev) => ({ ...prev, [item.id]: newQty }));
        setProcessingIds((prev) => [...prev, item.id]);

        if (delta > 0) {
            router.post(
                `/warehouse/items/${item.id}/increment`,
                {},
                {
                    preserveScroll: true,
                    onError: () => {
                        setOptimisticQuantities((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                        });
                    },
                    onFinish: () => {
                        setProcessingIds((prev) =>
                            prev.filter((id) => id !== item.id),
                        );
                        setOptimisticQuantities((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                        });
                    },
                },
            );
        } else {
            router.post(
                `/warehouse/items/${item.id}/decrement`,
                {},
                {
                    preserveScroll: true,
                    onError: () => {
                        setOptimisticQuantities((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                        });
                    },
                    onFinish: () => {
                        setProcessingIds((prev) =>
                            prev.filter((id) => id !== item.id),
                        );
                        setOptimisticQuantities((prev) => {
                            const next = { ...prev };
                            delete next[item.id];
                            return next;
                        });
                    },
                },
            );
        }
    };

    const itemsList = (localItems || [])
        .filter((item: Item) => {
            if (!search) return true;
            const s = search.toLowerCase();
            return (
                item.name.toLowerCase().includes(s) ||
                (item.category || []).some((cat: string) =>
                    cat.toLowerCase().includes(s),
                ) ||
                (item.changed_by || '').toLowerCase().includes(s) ||
                String(item.quantity).includes(s)
            );
        })
        .sort((a: Item, b: Item) => {
            // Default sort: ID desc (newest first) or last_modified desc
            if (!sort.column) {
                // use ID as proxy for creation time if last_modified is null or equal
                return b.id - a.id;
            }
            const valA = a[sort.column];
            const valB = b[sort.column];

            if (sort.column === 'category') {
                // simplified array comparison
                const strA = (a.category || []).join(', ');
                const strB = (b.category || []).join(', ');
                return sort.dir === 'asc'
                    ? strA.localeCompare(strB)
                    : strB.localeCompare(strA);
            }

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const cmp = valA < valB ? -1 : 1;
            return sort.dir === 'asc' ? cmp : -cmp;
        });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse" />

            <div className="flex h-full flex-1 flex-col p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex w-1/2 items-center gap-2">
                        {/* ... search input ... */}
                        <div className="relative w-full">
                            <Input
                                placeholder="Search by name, category, email or quantity"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                            <div className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                                <Search size={16} />
                            </div>
                        </div>
                        <div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearch('');
                                    setSort({ column: null, dir: 'asc' });
                                }}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    <div>
                        {canCreate && (
                            <Button onClick={openCreate}>Create Item</Button>
                        )}
                    </div>
                </div>

                {/* ... Dialogs ... */}
                <CreateItemDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    categories={categoriesProp}
                />

                <div className="flex-1 overflow-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                        {/* ... thead ... */}
                        <thead className="bg-gray-50 dark:bg-transparent">
                            <tr>
                                {/* Name */}
                                <th className="px-2 py-3 text-left text-xs font-medium uppercase sm:px-6">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'name',
                                                dir:
                                                    s.column === 'name' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Name</span>
                                        {sort.column === 'name' ? (
                                            sort.dir === 'asc' ? (
                                                <ChevronUpIcon size={14} />
                                            ) : (
                                                <ChevronDownIcon size={14} />
                                            )
                                        ) : (
                                            <ChevronUpIcon
                                                size={14}
                                                className="opacity-30"
                                            />
                                        )}
                                    </button>
                                </th>
                                {/* Quantity */}
                                <th className="px-2 py-3 text-left text-xs font-medium uppercase sm:px-6">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'quantity',
                                                dir:
                                                    s.column === 'quantity' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Qty</span>
                                        {sort.column === 'quantity' ? (
                                            sort.dir === 'asc' ? (
                                                <ChevronUpIcon size={14} />
                                            ) : (
                                                <ChevronDownIcon size={14} />
                                            )
                                        ) : (
                                            <ChevronUpIcon
                                                size={14}
                                                className="opacity-30"
                                            />
                                        )}
                                    </button>
                                </th>
                                {/* Image */}
                                <th className="px-2 py-3 text-left text-xs font-medium uppercase sm:px-6">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'category',
                                                dir:
                                                    s.column === 'category' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Img</span>
                                        <ChevronUpIcon
                                            size={14}
                                            className="opacity-30"
                                        />
                                    </button>
                                </th>
                                {/* Category - Hidden on mobile */}
                                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase sm:table-cell">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'category',
                                                dir:
                                                    s.column === 'category' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Category</span>
                                        {sort.column === 'category' ? (
                                            sort.dir === 'asc' ? (
                                                <ChevronUpIcon size={14} />
                                            ) : (
                                                <ChevronDownIcon size={14} />
                                            )
                                        ) : (
                                            <ChevronUpIcon
                                                size={14}
                                                className="opacity-30"
                                            />
                                        )}
                                    </button>
                                </th>
                                {/* Last Modified - Hidden on mobile */}
                                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase sm:table-cell">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'last_modified',
                                                dir:
                                                    s.column ===
                                                        'last_modified' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Last Modified</span>
                                        {sort.column === 'last_modified' ? (
                                            sort.dir === 'asc' ? (
                                                <ChevronUpIcon size={14} />
                                            ) : (
                                                <ChevronDownIcon size={14} />
                                            )
                                        ) : (
                                            <ChevronUpIcon
                                                size={14}
                                                className="opacity-30"
                                            />
                                        )}
                                    </button>
                                </th>
                                {/* Changed By - Hidden on mobile */}
                                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase sm:table-cell">
                                    <button
                                        className="flex items-center gap-2"
                                        onClick={() =>
                                            setSort((s) => ({
                                                column: 'changed_by',
                                                dir:
                                                    s.column === 'changed_by' &&
                                                        s.dir === 'asc'
                                                        ? 'desc'
                                                        : 'asc',
                                            }))
                                        }
                                    >
                                        <span>Changed By</span>
                                        {sort.column === 'changed_by' ? (
                                            sort.dir === 'asc' ? (
                                                <ChevronUpIcon size={14} />
                                            ) : (
                                                <ChevronDownIcon size={14} />
                                            )
                                        ) : (
                                            <ChevronUpIcon
                                                size={14}
                                                className="opacity-30"
                                            />
                                        )}
                                    </button>
                                </th>
                                <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase sm:table-cell">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-neutral-700 dark:bg-transparent">
                            {itemsList.map((item: Item) => (
                                <tr key={item.id}>
                                    <td className="max-w-[8rem] px-2 py-4 sm:max-w-none sm:px-6">
                                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                                            <div className="truncate text-xs sm:text-sm">
                                                {item.name}
                                            </div>
                                            {canUpdate && (
                                                <button
                                                    type="button"
                                                    className="ml-1 shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
                                                    aria-label={`Edit ${item.name}`}
                                                    onClick={() =>
                                                        openEditFor(item)
                                                    }
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 sm:px-6">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3"
                                                onClick={() =>
                                                    changeQuantity(item, -1)
                                                }
                                                disabled={
                                                    !canUpdate ||
                                                    (optimisticQuantities[
                                                        item.id
                                                    ] ?? item.quantity) <= 0 ||
                                                    processingIds.includes(
                                                        item.id,
                                                    )
                                                }
                                                aria-label={`Decrease quantity for ${item.name}`}
                                            >
                                                {processingIds.includes(
                                                    item.id,
                                                ) ? (
                                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent sm:h-4 sm:w-4" />
                                                ) : (
                                                    <Minus
                                                        size={12}
                                                        className="sm:hidden"
                                                    />
                                                )}
                                                <Minus
                                                    size={14}
                                                    className="hidden sm:block"
                                                />
                                            </Button>

                                            <span className="w-8 text-center text-xs sm:w-12 sm:text-sm">
                                                {optimisticQuantities[
                                                    item.id
                                                ] ?? item.quantity}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3"
                                                onClick={() =>
                                                    changeQuantity(item, 1)
                                                }
                                                disabled={
                                                    !canUpdate ||
                                                    processingIds.includes(
                                                        item.id,
                                                    )
                                                }
                                                aria-label={`Increase quantity for ${item.name}`}
                                            >
                                                {processingIds.includes(
                                                    item.id,
                                                ) ? (
                                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent sm:h-4 sm:w-4" />
                                                ) : (
                                                    <Plus
                                                        size={12}
                                                        className="sm:hidden"
                                                    />
                                                )}
                                                <Plus
                                                    size={14}
                                                    className="hidden sm:block"
                                                />
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 sm:px-6">
                                        {(item as any).image_url ? (
                                            <LazyImage
                                                src={(item as any).image_url}
                                                alt={item.name}
                                                className="h-10 w-10 rounded object-cover sm:h-16 sm:w-16"
                                            />
                                        ) : null}
                                    </td>
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div>
                                            {(item.category || []).join(', ')}
                                        </div>
                                    </td>
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        {item.last_modified
                                            ? new Date(
                                                item.last_modified,
                                            ).toLocaleString()
                                            : '-'}
                                    </td>
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        {item.changed_by ?? '-'}
                                    </td>
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div className="flex gap-2">
                                            {canUpdate && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openEditFor(item)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        openDeleteFor(item)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <EditItemDialog
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    item={selectedItem}
                    categories={categoriesProp}
                    onDeleteRequest={(item) => {
                        setEditOpen(false);
                        openDeleteFor(item);
                    }}
                />

                <DeleteItemDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    item={selectedItem}
                />
            </div>
        </AppLayout>
    );
}
