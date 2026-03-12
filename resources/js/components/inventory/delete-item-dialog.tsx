import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import type { InventoryItem } from '@/types/inventory';

interface DeleteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: InventoryItem | null;
}

export function DeleteItemDialog({
    open,
    onOpenChange,
    item,
}: DeleteItemDialogProps) {
    const form = useForm();

    const handleDelete = () => {
        if (!item) return;
        form.delete(`/inventory/items/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete item</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete{' '}
                    <span className="font-medium">{item?.name ?? ''}</span>?
                    This action cannot be undone.
                </DialogDescription>

                <div className="mt-4 flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
