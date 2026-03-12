import { useForm } from '@inertiajs/react';
import * as React from 'react';
import {
    ItemFormDialogBase
    
} from '@/components/inventory/item-form-dialog-base';
import type {ItemFormState} from '@/components/inventory/item-form-dialog-base';

interface CreateItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
}

export function CreateItemDialog({
    open,
    onOpenChange,
    categories,
}: CreateItemDialogProps) {
    const form = useForm<ItemFormState>({
        name: '',
        quantity: 0,
        category: [],
        image: null,
    });

    // Reset when dialog closes
    React.useEffect(() => {
        if (!open) {
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleFieldChange = <K extends keyof ItemFormState>(
        key: K,
        value: ItemFormState[K],
         
    ) => form.setData(key, value as any);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.name.trim()) {
            form.setError('name', 'Name is required.');
            return;
        }

        form.post('/inventory/items', {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    return (
        <ItemFormDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Create item"
            description="Add a new item to the inventory."
            categories={categories}
            formData={form.data}
            errors={form.errors}
            processing={form.processing}
            submitLabel="Create"
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
        />
    );
}
