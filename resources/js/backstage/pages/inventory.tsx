import { Head, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import * as React from 'react';
import { CreateItemDialog } from '@backstage/components/inventory/create-item-dialog';
import { DeleteItemDialog } from '@backstage/components/inventory/delete-item-dialog';
import { EditItemDialog } from '@backstage/components/inventory/edit-item-dialog';
import { InventoryTable } from '@backstage/components/inventory/inventory-table';
import { Button } from '@backstage/components/ui/button';
import { Input } from '@backstage/components/ui/input';
import { usePermissions } from '@backstage/hooks/use-permission';
import { useInventory } from '@backstage/hooks/use-inventory';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';
import type { InventoryItem } from '@backstage/types/inventory';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '/inventory',
    },
];

export default function Inventory() {
    const { items: paginatedItems, categories: categoriesProp } = usePage()
        .props as unknown as {
        items: { data: InventoryItem[] };
        categories: string[];
    };

    const perms = usePermissions('create_item', 'update_item', 'delete_item');
    const canCreateItem = perms['create_item'];
    const canEditItem = perms['update_item'];
    const canDeleteItem = perms['delete_item'];

    const {
        filteredItems,
        search,
        setSearch,
        sort,
        toggleSort,
        clearFilters,
        changeQuantity,
        processingIds,
    } = useInventory({ initialItems: paginatedItems?.data ?? [] });

    // ── Dialog state ───────────────────────────────────────────────────────────
    const [createOpen, setCreateOpen] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [selectedItem, setSelectedItem] =
        React.useState<InventoryItem | null>(null);

    const openEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        setEditOpen(true);
    };

    const openDelete = (item: InventoryItem) => {
        setSelectedItem(item);
        setDeleteOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />

            <div className="flex h-full flex-1 flex-col p-4">
                {/* Toolbar */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex w-full max-w-md items-center gap-2">
                        <div className="relative w-full">
                            <Search
                                size={16}
                                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                placeholder="Search by name, category, email or quantity"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                        >
                            Clear
                        </Button>
                    </div>

                    {canCreateItem && (
                        <Button onClick={() => setCreateOpen(true)}>
                            Create Item
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <InventoryTable
                        items={filteredItems}
                        processingIds={processingIds}
                        sort={sort}
                        onSort={toggleSort}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onChangeQuantity={changeQuantity}
                        canEdit={canEditItem}
                        canDelete={canDeleteItem}
                        canChangeQuantity={canEditItem}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <CreateItemDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                categories={categoriesProp ?? []}
            />

            <EditItemDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                item={selectedItem}
                categories={categoriesProp ?? []}
                onDeleteRequest={(item) => {
                    setEditOpen(false);
                    openDelete(item);
                }}
            />

            <DeleteItemDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                item={selectedItem}
            />
        </AppLayout>
    );
}
