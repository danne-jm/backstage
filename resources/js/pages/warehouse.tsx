import CreateItemDialog from '@/components/warehouse/CreateItemDialog';
import DeleteItemDialog from '@/components/warehouse/DeleteItemDialog';
import EditItemDialog from '@/components/warehouse/EditItemDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { warehouse } from '@/routes';
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
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: warehouse().url,
    },
];

type Item = {
    id: number;
    name: string;
    quantity: number;
    category: string[] | null;
    last_modified: string | null;
    changed_by: string | null;
    image_url?: string | null;
};

export default function Warehouse() {
    const { items = [] } = usePage().props as { items?: Item[] };

    // Server-side filtering & sorting
    const pageProps: any = usePage().props as any;
    const itemsProp = pageProps.items;
    const categoriesProp: string[] = pageProps.categories ?? [];

    const itemsList: Item[] = Array.isArray(itemsProp?.data)
        ? itemsProp.data
        : Array.isArray(itemsProp)
            ? itemsProp
            : [];

    const [search, setSearch] = useState<string>(
        String(new URLSearchParams(window.location.search).get('search') ?? ''),
    );
    const [sort, setSort] = useState<{
        column: string | null;
        dir: 'asc' | 'desc';
    }>({
        column: new URLSearchParams(window.location.search).get('sort_col'),
        dir:
            (new URLSearchParams(window.location.search).get('sort_dir') as
                | 'asc'
                | 'desc') ?? 'asc',
    });

    // debounce search and update server-side results
    useEffect(() => {
        const t = setTimeout(() => {
            router.get(
                '/warehouse',
                {
                    search: search || undefined,
                    sort_col: sort.column || undefined,
                    sort_dir: sort.dir || undefined,
                },
                {
                    preserveState: true,
                    replace: true,
                    only: ['items', 'categories'],
                },
            );
        }, 300);

        return () => clearTimeout(t);
    }, [search, sort.column, sort.dir]);

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // optimistic UI: per-item optimistic quantities (id => qty)
    const [optimisticQuantities, setOptimisticQuantities] = useState<
        Record<number, number>
    >({});
    // track which item ids are currently processing (to disable controls / show spinner)
    const [processingIds, setProcessingIds] = useState<number[]>([]);

    function openCreate() {
        setCreateOpen(true);
    }

    function openEditFor(item: Item) {
        setSelectedItem(item);
        setEditOpen(true);
    }

    function openDeleteFor(item: Item) {
        setSelectedItem(item);
        setDeleteOpen(true);
    }

    // change quantity by delta (±1) with optimistic UI and processing state.
    function changeQuantity(item: Item, delta: number) {
        const currentQty = optimisticQuantities[item.id] ?? item.quantity;
        const newQty = currentQty + delta;
        if (newQty < 0) return; // prevent negative quantities

        const prevQty = currentQty;

        // optimistic update
        setOptimisticQuantities((m) => ({ ...m, [item.id]: newQty }));
        setProcessingIds((p) =>
            p.includes(item.id) ? p : p.concat([item.id]),
        );

        router.put(
            `/warehouse/items/${item.id}`,
            {
                name: item.name,
                quantity: newQty,
                category: item.category ?? [],
            },
            {
                preserveState: true,
                onSuccess: () => {
                    // server will send updated props; clear optimistic value for this item so UI uses server value
                    setOptimisticQuantities((m) => {
                        const copy = { ...m };
                        delete copy[item.id];
                        return copy;
                    });
                },
                onError: () => {
                    // revert optimistic change on error
                    setOptimisticQuantities((m) => ({
                        ...m,
                        [item.id]: prevQty,
                    }));
                },
                onFinish: () => {
                    setProcessingIds((p) => p.filter((id) => id !== item.id));
                },
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Warehouse" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex w-1/2 items-center gap-2">
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
                        <Button onClick={openCreate}>Create Item</Button>
                    </div>
                </div>

                <CreateItemDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    categories={categoriesProp}
                />

                <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                        <thead className="bg-gray-50 dark:bg-transparent">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                        <span>Quantity</span>
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                        <span>Image</span>
                                        {/* image column is not sortable but keep icon for visual parity */}
                                        <ChevronUpIcon
                                            size={14}
                                            className="opacity-30"
                                        />
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
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
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="truncate">
                                                {item.name}
                                            </div>
                                            <button
                                                type="button"
                                                className="ml-2 text-muted-foreground hover:text-foreground sm:hidden"
                                                aria-label={`Edit ${item.name}`}
                                                onClick={() =>
                                                    openEditFor(item)
                                                }
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    changeQuantity(item, -1)
                                                }
                                                disabled={
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
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                                ) : (
                                                    <Minus size={14} />
                                                )}
                                            </Button>

                                            <span className="w-12 text-center">
                                                {optimisticQuantities[
                                                    item.id
                                                ] ?? item.quantity}
                                            </span>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    changeQuantity(item, 1)
                                                }
                                                disabled={processingIds.includes(
                                                    item.id,
                                                )}
                                                aria-label={`Increase quantity for ${item.name}`}
                                            >
                                                {processingIds.includes(
                                                    item.id,
                                                ) ? (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                                ) : (
                                                    <Plus size={14} />
                                                )}
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(item as any).image_url ? (
                                            <div>
                                                <img
                                                    src={
                                                        (item as any).image_url
                                                    }
                                                    alt={item.name}
                                                    className="h-16 w-16 rounded object-cover"
                                                />
                                            </div>
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            {(item.category || []).join(', ')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.last_modified
                                            ? new Date(
                                                item.last_modified,
                                            ).toLocaleString()
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.changed_by ?? '-'}
                                    </td>
                                    <td className="hidden px-6 py-4 sm:table-cell">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    openEditFor(item)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    openDeleteFor(item)
                                                }
                                            >
                                                Delete
                                            </Button>
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
