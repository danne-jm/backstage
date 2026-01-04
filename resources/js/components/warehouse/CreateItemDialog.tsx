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
import { useRef, useState } from 'react';
import { CategorySelector } from './CategorySelector';

interface CreateItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
}

export default function CreateItemDialog({
    open,
    onOpenChange,
    categories,
}: CreateItemDialogProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm<{
        name: string;
        quantity: number;
        category: string[];
        image: File | null;
    }>({
        name: '',
        quantity: 0,
        category: [],
        image: null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.data.name || form.data.name.trim() === '') {
            return form.setError('name', 'Name is required');
        }
        if (form.data.quantity < 0) {
            return form.setError('quantity', 'Quantity must be 0 or greater');
        }

        form.post('/warehouse/items', {
            preserveState: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                setImagePreview(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Create item</DialogTitle>
                <DialogDescription>
                    Create a new inventory item.
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
                        {form.errors.category && (
                            <div className="mt-1 text-sm text-destructive">
                                {form.errors.category}
                            </div>
                        )}
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
                                } else {
                                    setImagePreview(null);
                                }
                                form.setData('image', f);
                            }}
                        />
                        <div className="mt-2">
                            {imagePreview ? (
                                <div className="flex items-center gap-4">
                                    <img
                                        src={imagePreview}
                                        className="h-20 w-20 rounded object-cover"
                                    />
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
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
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

                    <div className="mt-4 flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
