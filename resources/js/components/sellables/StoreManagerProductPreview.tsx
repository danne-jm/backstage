import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface StoreManagerProductPreviewProps {
    product: Product;
    onEdit: (product: Product) => void;
    isOnline: boolean;
    onSetOnline: (productId: number, isOnline: boolean) => void;
}

export function StoreManagerProductPreview({
    product,
    onEdit,
    isOnline,
    onSetOnline,
}: StoreManagerProductPreviewProps) {
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
            <div className="flex flex-col items-end gap-2">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(product)}
                >
                    Edit
                </Button>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`online-${product.id}`}
                        checked={isOnline}
                        onCheckedChange={checked =>
                            onSetOnline(product.id, checked === true)
                        }
                    />
                    <label
                        htmlFor={`online-${product.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Sell Online
                    </label>
                </div>
            </div>
        </div>
    );
}
