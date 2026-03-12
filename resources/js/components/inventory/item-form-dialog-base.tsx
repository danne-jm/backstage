import * as React from 'react';
import { CategorySelector } from '@/components/inventory/category-selector';
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

export interface ItemFormState {
    name: string;
    quantity: number;
    category: string[];
    image: File | null;
    remove_image?: boolean;
}

export interface ItemFormErrors {
    name?: string;
    quantity?: string;
    category?: string;
}

interface ItemFormDialogBaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    /** Current image URL for editing; null when creating */
    existingImageUrl?: string | null;
    categories: string[];
    formData: ItemFormState;
    errors: ItemFormErrors;
    processing: boolean;
    submitLabel: string;
    onFieldChange: <K extends keyof ItemFormState>(
        key: K,
        value: ItemFormState[K],
    ) => void;
    onSubmit: (e: React.FormEvent) => void;
    /** Extra footer content rendered to the left of Cancel/Submit (e.g. a Delete button) */
    footerExtra?: React.ReactNode;
}

/**
 * Shared foundation for Create- and Edit-item dialogs.
 * Renders the form fields (name, quantity, categories, image) and the standard footer.
 * Callers supply the form state and callbacks so they remain in full control.
 */
export function ItemFormDialogBase({
    open,
    onOpenChange,
    title,
    description,
    existingImageUrl,
    categories,
    formData,
    errors,
    processing,
    submitLabel,
    onFieldChange,
    onSubmit,
    footerExtra,
}: ItemFormDialogBaseProps) {
    const [imagePreview, setImagePreview] = React.useState<string | null>(
        existingImageUrl ?? null,
    );
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Keep preview in sync when the dialog opens with an existing image
    React.useEffect(() => {
        setImagePreview(existingImageUrl ?? null);
    }, [existingImageUrl, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;

        // Revoke any blob URL we created
        if (imagePreview && imagePreview.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(imagePreview);
            } catch {
                /* ignore */
            }
        }

        if (file) {
            setImagePreview(URL.createObjectURL(file));
            onFieldChange('remove_image', false);
        } else {
            setImagePreview(existingImageUrl ?? null);
        }

        onFieldChange('image', file);
    };

    const handleRemoveImage = () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(imagePreview);
            } catch {
                /* ignore */
            }
        }
        setImagePreview(null);
        onFieldChange('image', null);
        onFieldChange('remove_image', true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>

                <form onSubmit={onSubmit} className="grid gap-4">
                    {/* Name */}
                    <div>
                        <Label>Name</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                onFieldChange('name', e.target.value)
                            }
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Quantity */}
                    <div>
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            min={0}
                            value={String(formData.quantity)}
                            onChange={(e) =>
                                onFieldChange(
                                    'quantity',
                                    Number(e.target.value),
                                )
                            }
                        />
                        {errors.quantity && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.quantity}
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="mb-1">
                        <Label>Category</Label>
                        <CategorySelector
                            selected={formData.category}
                            onChange={(cats) => onFieldChange('category', cats)}
                            options={categories}
                        />
                        {errors.category && (
                            <p className="mt-1 text-sm text-destructive">
                                {errors.category}
                            </p>
                        )}
                    </div>

                    {/* Image */}
                    <div>
                        <Label>Image</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <div className="mt-2">
                            {imagePreview ? (
                                <div className="flex items-center gap-4">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
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
                                                onClick={handleRemoveImage}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        {existingImageUrl && (
                                            <p className="text-xs text-muted-foreground">
                                                Current image
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    Add image
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                        <div>{footerExtra}</div>
                        <div className="flex items-center gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing ? `${submitLabel}...` : submitLabel}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
