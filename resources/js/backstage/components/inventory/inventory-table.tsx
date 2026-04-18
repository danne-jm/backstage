import { Minus, Pencil, Plus } from 'lucide-react';
import * as React from 'react';
import { LazyImage } from '@backstage/components/inventory/lazy-image';
import { SortableTableHeader } from '@backstage/components/inventory/sortable-table-header';
import { Button } from '@backstage/components/ui/button';
import type { InventoryItem } from '@backstage/types/inventory';

type SortColumn = keyof InventoryItem;
type SortDir = 'asc' | 'desc';

interface InventoryTableProps {
    items: InventoryItem[];
    processingIds: string[];
    sort: { column: SortColumn | null; dir: SortDir };
    onSort: (column: SortColumn) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
    onChangeQuantity: (item: InventoryItem, delta: number) => void;
    canEdit?: boolean;
    canDelete?: boolean;
    canChangeQuantity?: boolean;
}

const TH_BASE = 'px-2 py-3 text-left text-xs font-medium uppercase sm:px-6';
const TH_HIDDEN = `hidden ${TH_BASE} sm:table-cell`;

export function InventoryTable({
    items,
    processingIds,
    sort,
    onSort,
    onEdit,
    onDelete,
    onChangeQuantity,
    canEdit = true,
    canDelete = true,
    canChangeQuantity = true,
}: InventoryTableProps) {
    if (items.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No items found.
            </div>
        );
    }

    return (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
            <thead className="bg-gray-50 dark:bg-transparent">
                <tr>
                    <SortableTableHeader
                        label="Name"
                        column="name"
                        activeColumn={sort.column}
                        direction={sort.dir}
                        onSort={onSort}
                        className={TH_BASE}
                    />
                    <SortableTableHeader
                        label="Qty"
                        column="quantity"
                        activeColumn={sort.column}
                        direction={sort.dir}
                        onSort={onSort}
                        className={TH_BASE}
                    />
                    {/* Image – static, no sort */}
                    <th className={TH_BASE}>Img</th>
                    <SortableTableHeader
                        label="Category"
                        column="category"
                        activeColumn={sort.column}
                        direction={sort.dir}
                        onSort={onSort}
                        className={TH_HIDDEN}
                    />
                    <SortableTableHeader
                        label="Last Modified"
                        column="last_modified"
                        activeColumn={sort.column}
                        direction={sort.dir}
                        onSort={onSort}
                        className={TH_HIDDEN}
                    />
                    <SortableTableHeader
                        label="Changed By"
                        column="changed_by"
                        activeColumn={sort.column}
                        direction={sort.dir}
                        onSort={onSort}
                        className={TH_HIDDEN}
                    />
                    {(canEdit || canDelete) && <th className={TH_HIDDEN}>Actions</th>}
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white dark:divide-neutral-700 dark:bg-transparent">
                {items.map((item) => {
                    const isProcessing = processingIds.includes(item.id);

                    return (
                        <tr key={item.id}>
                            {/* Name */}
                            <td className="max-w-[8rem] px-2 py-4 sm:max-w-none sm:px-6">
                                <div className="flex items-center justify-between gap-1 sm:gap-2">
                                    <span className="truncate text-xs sm:text-sm">
                                        {item.name}
                                    </span>
                                    {/* Mobile edit button */}
                                    {canEdit && (
                                        <button
                                            type="button"
                                            aria-label={`Edit ${item.name}`}
                                            className="ml-1 shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    )}
                                </div>
                            </td>

                            {/* Quantity stepper */}
                            <td className="px-2 py-4 sm:px-6">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    {canChangeQuantity && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            aria-label={`Decrease quantity for ${item.name}`}
                                            className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3"
                                            disabled={
                                                item.quantity <= 0 || isProcessing
                                            }
                                            onClick={() =>
                                                onChangeQuantity(item, -1)
                                            }
                                        >
                                            {isProcessing ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent sm:h-4 sm:w-4" />
                                            ) : (
                                                <Minus size={14} />
                                            )}
                                        </Button>
                                    )}

                                    <span className="w-8 text-center text-xs sm:w-12 sm:text-sm">
                                        {item.quantity}
                                    </span>

                                    {canChangeQuantity && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            aria-label={`Increase quantity for ${item.name}`}
                                            className="h-7 w-7 p-0 sm:h-9 sm:w-auto sm:px-3"
                                            disabled={isProcessing}
                                            onClick={() =>
                                                onChangeQuantity(item, 1)
                                            }
                                        >
                                            {isProcessing ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent sm:h-4 sm:w-4" />
                                            ) : (
                                                <Plus size={14} />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </td>

                            {/* Image */}
                            <td className="px-2 py-4 sm:px-6">
                                {item.image_url && (
                                    <LazyImage
                                        src={item.image_url}
                                        alt={item.name}
                                        className="h-10 w-10 rounded object-cover sm:h-16 sm:w-16"
                                    />
                                )}
                            </td>

                            {/* Category – desktop */}
                            <td className="hidden px-6 py-4 sm:table-cell">
                                {(item.category ?? []).join(', ')}
                            </td>

                            {/* Last Modified – desktop */}
                            <td className="hidden px-6 py-4 sm:table-cell">
                                {item.last_modified
                                    ? new Date(
                                          item.last_modified,
                                      ).toLocaleString()
                                    : '-'}
                            </td>

                            {/* Changed By – desktop */}
                            <td className="hidden px-6 py-4 sm:table-cell">
                                {item.changed_by ?? '-'}
                            </td>

                            {/* Actions – desktop */}
                            {(canEdit || canDelete) && (
                                <td className="hidden px-6 py-4 sm:table-cell">
                                    <div className="flex gap-2">
                                        {canEdit && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onEdit(item)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => onDelete(item)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
