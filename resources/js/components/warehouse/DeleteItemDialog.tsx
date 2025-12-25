import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';

interface Item {
    id: number;
    name: string;
}

interface DeleteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item | null;
}

export default function DeleteItemDialog({
    open,
    onOpenChange,
    item,
}: DeleteItemDialogProps) {
    const form = useForm();

    function submit() {
        if (!item) return;
        form.delete(`/warehouse/items/${item.id}`, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Delete item</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete {item?.name ?? ''}? This
                    action cannot be undone.
                </DialogDescription>

                <div className="mt-4 flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={submit}
                        disabled={form.processing}
                    >
                        {form.processing ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
