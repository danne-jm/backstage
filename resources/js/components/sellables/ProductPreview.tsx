import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import * as React from 'react';

import type { Product } from '@/types/sellables';

interface ProductPreviewProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete?: (productId: number) => void;
    productToDelete?: number | null;
    setProductToDelete?: (id: number | null) => void;
    variant: 'sellables' | 'store-manager';
    isOnline?: boolean;
    onSetOnline?: (productId: number, isOnline: boolean) => void;
}

export function ProductPreview({
    product,
    onEdit,
    onDelete,
    productToDelete,
    setProductToDelete,
    variant,
    isOnline,
    onSetOnline,
}: ProductPreviewProps) {
    return (
        <div className="relative rounded-lg border p-4">
            <div>
                <div className="flex items-start justify-between">
                    <h3 className="font-medium">{product.name}</h3>

                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>
                            Edit
                        </Button>
                        {variant === 'sellables' && onDelete && setProductToDelete && (
                            <>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-muted-foreground hover:bg-muted/30"
                                    onClick={() => setProductToDelete(product.id)}
                                >
                                    Remove
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {product.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {product.description}
                    </p>
                )}
                {/* Price: label muted, value prominent */}
                <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">Price:</span>{' '}
                    <span className="text-foreground">€{product.price}</span>
                </div>
                <div className="mt-1 text-sm flex items-center justify-between">
                    <div className="min-w-0">
                    {product.variable_amount ? (
                        <>
                            <span className="text-muted-foreground">
                                Qty w/ Card:
                            </span>{' '}
                            {product.quantity_with_card === -1
                                ? 'Unlimited'
                                : product.quantity_with_card}
                            {product.quantity_with_card !== -1 &&
                                product.remaining_with_card !== undefined &&
                                product.remaining_with_card !== null && (
                                    <span className="text-gray-500">
                                        {' '}
                                        | {product.remaining_with_card} remain
                                    </span>
                                )}{' '}
                            |{' '}
                            <span className="text-muted-foreground">
                                w/o Card:
                            </span>{' '}
                            {product.quantity_without_card === -1
                                ? 'Unlimited'
                                : product.quantity_without_card}
                            {product.quantity_without_card !== -1 &&
                                product.remaining_without_card !== undefined &&
                                product.remaining_without_card !== null && (
                                    <span className="text-gray-500">
                                        {' '}
                                        | {product.remaining_without_card} remain
                                    </span>
                                )}
                        </>
                    ) : (
                        <>
                            <span className="text-muted-foreground">
                                Quantity:
                            </span>{' '}
                            {product.quantity === -1
                                ? 'Unlimited'
                                : product.quantity}
                            {product.quantity !== -1 &&
                                product.remaining !== undefined &&
                                product.remaining !== null && (
                                    <span className="text-gray-500">
                                        {' '}
                                        | {product.remaining} remain
                                    </span>
                                )}
                        </>
                    )}
                    </div>

                    {variant === 'store-manager' && onSetOnline && (
                        <div className="flex items-center space-x-2 ml-4">
                            <Checkbox
                                id={`online-${product.id}`}
                                checked={isOnline}
                                onCheckedChange={checked => onSetOnline(product.id, checked === true)}
                            />
                            <label
                                htmlFor={`online-${product.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Sell Online
                            </label>
                        </div>
                    )}
                </div>
            </div>
            {/* Delete dialog (kept out of flow) */}
            {variant === 'sellables' && onDelete && setProductToDelete && (
                <Dialog
                    open={productToDelete === product.id}
                    onOpenChange={open => !open && setProductToDelete(null)}
                >
                    <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={() => onDelete(product.id)}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Sell Online is rendered inline next to the quantity line above when in store-manager variant */}
        </div>
    );
}
