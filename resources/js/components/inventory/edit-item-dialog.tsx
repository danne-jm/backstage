import { useForm } from '@inertiajs/react';
import * as React from 'react';
import {
    ItemFormDialogBase
    
} from '@/components/inventory/item-form-dialog-base';
import type {ItemFormState} from '@/components/inventory/item-form-dialog-base';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/types/inventory';

interface EditItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
    categories: string[];
    onDeleteRequest: (item: InventoryItem) => void;
}

export function EditItemDialog({
    open,
    onOpenChange,
    item,
    categories,
    onDeleteRequest,
}: EditItemDialogProps) {
    const form = useForm<ItemFormState>({
        name: '',
        quantity: 0,
        category: [],
        image: null,
        remove_image: false,
    });

    // Populate form when the dialog opens with an item
    React.useEffect(() => {
        if (open && item) {
            form.setData({
                name: item.name,
                quantity: item.quantity,
                category: item.category ?? [],
                image: null,
                remove_image: false,
            });
        }
        if (!open) {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item]);

    const handleFieldChange = <K extends keyof ItemFormState>(
        key: K,
        value: ItemFormState[K],
         
    ) => form.setData(key, value as any);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        if (!form.data.name.trim()) {
            form.setError('name', 'Name is required.');
            return;
        }

        form.transform((data) => ({ ...data, _method: 'PUT' }));

        form.post(`/inventory/items/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    const footerExtra = item ? (
        <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
                onOpenChange(false);
                onDeleteRequest(item);
            }}
        >
            Delete
        </Button>
    ) : undefined;

    return (
        <ItemFormDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Edit item"
            description="Update the item details below."
            existingImageUrl={item?.image_url ?? null}
            categories={categories}
            formData={form.data}
            errors={form.errors}
            processing={form.processing}
            submitLabel="Save"
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
            footerExtra={footerExtra}
        />
    );
}
