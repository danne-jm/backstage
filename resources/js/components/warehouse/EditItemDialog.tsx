import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { CategorySelector } from './CategorySelector';

// Simplified Item type matching the one in the parent
interface Item {
    id: number;
    name: string;
    quantity: number;
    category: string[] | null;
    last_modified: string | null;
    changed_by: string | null;
    image_url?: string | null;
}

interface EditItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: Item | null;
    categories: string[];
    onDeleteRequest: (item: Item) => void;
}

export default function EditItemDialog({
    open,
    onOpenChange,
    item,
    categories,
    onDeleteRequest,
}: EditItemDialogProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<{
        name: string;
        quantity: number;
        category: string[];
        image: File | null;
        remove_image?: boolean;
    }>({
        name: '',
        quantity: 0,
        category: [],
        image: null,
        remove_image: false,
    });

    useEffect(() => {
        if (open && item) {
            form.reset();
            form.setData({
                name: item.name,
                quantity: item.quantity,
                category: item.category ?? [],
                image: null,
                remove_image: false,
            });

            setImagePreview(item.image_url ?? null);
            // setRemoveImage(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!item) return;

        if (!form.data.name || form.data.name.trim() === '') {
            return form.setError('name', 'Name is required');
        }
        if (form.data.quantity < 0) {
            return form.setError('quantity', 'Quantity must be 0 or greater');
        }

        form.transform((data) => ({
            ...data,
            _method: 'PUT',
        }));

        form.post(`/warehouse/items/${item.id}`, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                setImagePreview(null);
                // setRemoveImage(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Edit item</DialogTitle>
                <DialogDescription>
                    Update the item details below.
                </DialogDescription>

                <form onSubmit={submit} className="grid gap-3">
                    <div>
                        <Label>Name</Label>
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        {form.errors.name && (
                            <div className="mt-1 text-sm text-destructive">
                                {form.errors.name}
                            </div>
                        )}
                    </div>

                    <div>
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            value={String(form.data.quantity)}
                            onChange={(e) =>
                                form.setData('quantity', Number(e.target.value))
                            }
                        />
                        {form.errors.quantity && (
                            <div className="mt-1 text-sm text-destructive">
                                {form.errors.quantity}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <Label>Category</Label>
                        <CategorySelector
                            selected={form.data.category}
                            onChange={(cats) => form.setData('category', cats)}
                            options={categories}
                        />
                    </div>

                    <div className="mb-4">
                        <Label>Image</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                if (imagePreview) {
                                    try {
                                        URL.revokeObjectURL(imagePreview);
                                    } catch {
                                        // ignore
                                    }
                                }
                                if (f) {
                                    const url = URL.createObjectURL(f);
                                    setImagePreview(url);
                                    // setRemoveImage(false);
                                    form.setData('remove_image', false);
                                } else {
                                    setImagePreview(item?.image_url ?? null);
                                }
                                form.setData('image', f);
                            }}
                        />

                        <div className="mt-2 flex items-center gap-4">
                            {imagePreview ? (
                                <>
                                    <img
                                        src={imagePreview}
                                        className="h-20 w-20 rounded object-cover"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                            >
                                                Change
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    form.setData('image', null);
                                                    setImagePreview(null);
                                                    // setRemoveImage(true);
                                                    form.setData(
                                                        'remove_image',
                                                        true,
                                                    );
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Current image
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    Add image
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <Button
                                size="sm"
                                variant="destructive"
                                type="button"
                                onClick={() => {
                                    if (!item) return;
                                    onDeleteRequest(item);
                                }}
                            >
                                Delete
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
