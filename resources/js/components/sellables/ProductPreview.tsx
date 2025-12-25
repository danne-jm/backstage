import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';

import * as React from 'react';

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quantity?: number | null;
    variable_amount?: boolean;
    quantity_with_card?: number | null;
    quantity_without_card?: number | null;
    remaining: number;
    remaining_with_card?: number;
    remaining_without_card?: number;
}

interface ProductPreviewProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (productId: number) => void;
    productToDelete: number | null;
    setProductToDelete: (id: number | null) => void;
}

export function ProductPreview({
    product,
    onEdit,
    onDelete,
    productToDelete,
    setProductToDelete,
}: ProductPreviewProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
                <h3 className="font-medium">{product.name}</h3>
                {product.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {product.description}
                    </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                    €{product.price}
                </p>
                <div className="mt-1 text-sm">
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
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(product)}
                >
                    Edit
                </Button>
                <>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:bg-muted/30"
                        onClick={() => setProductToDelete(product.id)}
                    >
                        Remove
                    </Button>

                    <Dialog
                        open={productToDelete === product.id}
                        onOpenChange={open => !open && setProductToDelete(null)}
                    >
                        <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                            <DialogTitle>Delete Product</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{product.name}
                                "? This action cannot be undone.
                            </DialogDescription>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={() => onDelete(product.id)}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            </div>
        </div>
    );
}
