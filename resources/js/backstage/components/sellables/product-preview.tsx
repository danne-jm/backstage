import { ImageIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import { Checkbox } from '@backstage/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@backstage/components/ui/dialog';
import { Input } from '@backstage/components/ui/input';
import { cn, formatCurrency } from '@backstage/lib/utils';

import type { Product } from '@backstage/types/sellables';

interface ProductPreviewProps {
    product: Product;
    onEdit?: (product: Product) => void;
    onDelete?: (productId: number) => void;
    productToDelete?: number | null;
    setProductToDelete?: (id: number | null) => void;
    variant: 'sellables' | 'store-manager';
    isOnline?: boolean;
    onSetOnline?: (
        productId: number,
        isOnline: boolean,
        type?: 'product' | 'event',
    ) => void;
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
    const [deleteStep, setDeleteStep] = React.useState<'input' | 'confirm'>('input');
    const [confirmText, setConfirmText] = React.useState('');

    return (
        <div
            className={cn(
                'relative flex gap-4 rounded-lg border p-4',
                // Keep store-manager as block, sellables as flex (row)
                variant === 'store-manager' ? 'block' : 'flex',
                // Remove extra padding bottom from sellables
                variant === 'sellables' ? 'pb-4' : 'pb-4',
            )}
        >
            {/* Image Thumbnail - Rendered differently based on variant */}
            {/* For Sellables (Flex Layout), keep it here. For Store Manager (Float Layout), render inside main block */}
            {variant === 'sellables' && (
                <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50 sm:block">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/50">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                    )}
                </div>
            )}

            <div className="block min-w-0 flex-1">
                {/* Store Manager: Image Floated Left */}
                {variant === 'store-manager' && (
                    <div className="float-left mr-4 mb-1 hidden h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50 sm:block">
                        {product.image ? (
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground/50">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                )}

                {/* Desktop Store Manager Actions: Floated Right */}
                {variant === 'store-manager' && onEdit && (
                    <div className="float-right mb-2 ml-4 hidden md:block">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(product)}
                            className="h-8 px-2"
                        >
                            Edit
                        </Button>
                    </div>
                )}

                <div
                    className={
                        variant === 'sellables'
                            ? 'flex flex-col gap-4 md:flex-row'
                            : 'block'
                    }
                >
                    <div className="min-w-0 flex-1">
                        {/* Title and Mobile Actions Row */}
                        <div className="flex items-start justify-between">
                            <h3
                                className={cn(
                                    'font-medium',
                                    variant === 'store-manager' &&
                                    isOnline &&
                                    product.name.length >= 26 &&
                                    'max-w-[150px] truncate md:max-w-none md:overflow-visible md:whitespace-normal',
                                )}
                            >
                                {product.name}
                            </h3>

                            {/* Mobile Actions Only */}
                            <div className="flex items-center gap-1 md:hidden">
                                {onEdit && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onEdit(product)}
                                        className="h-8 px-2"
                                    >
                                        Edit
                                    </Button>
                                )}
                                {variant === 'sellables' &&
                                    onDelete &&
                                    setProductToDelete && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2 text-muted-foreground hover:bg-muted/30"
                                            onClick={() =>
                                                setProductToDelete(product.id)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    )}
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <p
                                className={cn(
                                    'mt-1 text-sm text-muted-foreground',
                                )}
                            >
                                {product.description}
                            </p>
                        )}

                        {/* Price: mirror event dual-pricing wording when ESNcard prices are configured */}
                        <div className="mt-1 text-sm">
                            {product.price_with_card != null &&
                            product.price_without_card != null &&
                            product.price_with_card < product.price_without_card ? (
                                <>
                                    <span className="text-muted-foreground">
                                        Price with ESNcard:
                                    </span>{' '}
                                    {formatCurrency(product.price_with_card)}{' '}
                                    <span className="text-muted-foreground">
                                        | without ESNcard:
                                    </span>{' '}
                                    {formatCurrency(product.price_without_card)}
                                </>
                            ) : (
                                <>
                                    <span className="text-muted-foreground">
                                        Price:
                                    </span>{' '}
                                    <span className="text-foreground">
                                        {formatCurrency(product.price)}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="mt-1 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                                {product.variants_config &&
                                    product.variants_config.length > 0 ? (
                                    <>
                                        <span className="text-muted-foreground">
                                            Quantity by:
                                        </span>{' '}
                                        <span className="text-foreground">
                                            {(product.variants_config || [])
                                                .map((vc) => vc.name)
                                                .join(', ')}
                                        </span>
                                        {/* Variants Matrix - Store Manager Only here (hidden on mobile for sellables) */}
                                        <div
                                            className={cn(
                                                'mt-2',
                                                variant === 'sellables'
                                                    ? 'hidden'
                                                    : 'hidden md:block',
                                            )}
                                        >
                                            {variant ===
                                                'store-manager' ? null : (
                                                <VariantsMatrix
                                                    product={product}
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : product.variable_amount ? (
                                    <>
                                        <span className="text-muted-foreground">
                                            Qty w/ ESNcard:
                                        </span>{' '}
                                        {product.unlimited_quantity_with_card || product.quantity_with_card == null
                                            ? 'Unlimited'
                                            : product.remaining_with_card != null
                                                ? `${product.remaining_with_card} left / ${(product.quantity_with_card - product.remaining_with_card)} sold`
                                                : product.quantity_with_card}{' '}
                                        |{' '}
                                        <span className="text-muted-foreground">
                                            w/o ESNcard:
                                        </span>{' '}
                                        {product.unlimited_quantity_without_card || product.quantity_without_card == null
                                            ? 'Unlimited'
                                            : product.remaining_without_card != null
                                                ? `${product.remaining_without_card} left / ${(product.quantity_without_card - product.remaining_without_card)} sold`
                                                : product.quantity_without_card}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-muted-foreground">
                                            Quantity:
                                        </span>{' '}
                                        {product.unlimited_quantity || product.quantity == null
                                            ? 'Unlimited'
                                            : product.remaining != null
                                                ? `${product.remaining} left / ${product.quantity - product.remaining} sold`
                                                : product.quantity}
                                    </>
                                )}
                            </div>

                            {/* Sell Online Checkbox - Inline with Quantity for Store Manager */}
                            {variant === 'store-manager' && onSetOnline && (
                                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                    <Checkbox
                                        id={`online-${product.id}`}
                                        checked={!!isOnline}
                                        onCheckedChange={(checked) =>
                                            onSetOnline(
                                                product.id,
                                                checked === true,
                                                'product',
                                            )
                                        }
                                    />
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        Sell Online
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center Column: Variant Matrix (Sellables only, Desktop only) */}
                    {variant === 'sellables' &&
                        product.variants_config &&
                        product.variants_config.length > 0 && (
                            <div className="hidden w-[400px] flex-shrink-0 md:block">
                                <VariantsMatrix product={product} />
                            </div>
                        )}

                    {/* Right Column: Actions (Desktop) - ONLY for Sellables now. Store Manager uses floated button. */}
                    {variant === 'sellables' && (onEdit || onDelete) && (
                        <div className="hidden flex-shrink-0 flex-row items-start gap-2 md:flex">
                            {onEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEdit(product)}
                                    className="h-8 px-2"
                                >
                                    Edit
                                </Button>
                            )}
                            {onDelete && setProductToDelete && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-muted-foreground hover:bg-muted/30"
                                    onClick={() =>
                                        setProductToDelete(product.id)
                                    }
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete dialog (kept out of flow) */}
            {variant === 'sellables' && onDelete && setProductToDelete && (
                <Dialog
                    open={productToDelete === product.id}
                    onOpenChange={(open) => {
                        if (!open) {
                            setProductToDelete(null);
                            setDeleteStep('input');
                            setConfirmText('');
                        }
                    }}
                >
                    <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-lg p-6">
                        <DialogTitle>Delete Product</DialogTitle>
                        <div className="mt-2 flex flex-col justify-between flex-1 min-h-[150px]">
                            {deleteStep === 'input' ? (
                                <>
                                    <div>
                                        <DialogDescription>
                                            To delete "<strong>{product.name}</strong>", please type its name exactly to confirm. This extra step helps prevent accidental removals.
                                        </DialogDescription>
                                        <div className="mt-4">
                                            <Input
                                                value={confirmText}
                                                onChange={(e) => setConfirmText(e.target.value)}
                                                placeholder="Type product name"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button variant="ghost" onClick={() => setProductToDelete(null)}>Cancel</Button>
                                        <Button
                                            disabled={confirmText !== product.name}
                                            onClick={() => setDeleteStep('confirm')}
                                        >
                                            Next
                                        </Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                <>
                                    <DialogDescription>
                                        Are you sure you want to delete "{product.name}"? This action is permanent. All associated settings, records, and history will be lost and cannot be recovered.
                                    </DialogDescription>
                                    <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                        <Button variant="ghost" onClick={() => setDeleteStep('input')}>Back</Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => onDelete(product.id)}
                                        >
                                            Delete
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </div>
                        <div className="flex justify-center gap-2 mt-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full transition-all", deleteStep === 'input' ? "bg-primary w-4" : "bg-muted-foreground/30")} />
                            <div className={cn("h-1.5 w-1.5 rounded-full transition-all", deleteStep === 'confirm' ? "bg-primary w-4" : "bg-muted-foreground/30")} />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function VariantsMatrix({ product }: { product: Product }) {
    if (!product.variants || product.variants.length === 0) return null;

    // Helper to format quantity as "X left / Y sold"
    const formatVariantQuantity = (v: any) => {
        if (v.quantity === null) return 'Unl.';
        const remaining = v.remaining ?? v.quantity;
        const sold = v.quantity - remaining;
        return `${remaining} left / ${sold} sold`;
    };

    if (!product.variants_config || product.variants_config.length === 0) {
        // Fallback for "variants" mode but no config? Just list them.
        return (
            <div className="space-y-1">
                {(product.variants || []).map((v, i) => (
                    <div
                        key={v.id || i}
                        className="text-xs text-muted-foreground"
                    >
                        •{' '}
                        {Object.entries(v.options || {})
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(', ')}
                        {' - '}
                        {v.quantity === null
                            ? 'Unl.'
                            : formatVariantQuantity(v)}
                    </div>
                ))}
            </div>
        );
    }

    const configs = product.variants_config;

    // Helper to find variant by options
    const getVariant = (options: Record<string, string>) => {
        return product.variants?.find((v) => {
            for (const [key, val] of Object.entries(options)) {
                if ((v.options || {})[key] !== val) return false;
            }
            return true;
        });
    };

    // Case 1: Single Dimension (e.g. Size)
    if (configs.length === 1) {
        const config = configs[0];
        return (
            <div className="mt-2 overflow-hidden rounded-md border text-xs md:overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-1.5 font-medium">{config.name}</th>
                            <th className="p-1.5 font-medium">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {(config.options || []).map((opt) => {
                            const v = getVariant({ [config.name]: opt });
                            return (
                                <tr key={opt}>
                                    <td className="p-1.5">{opt}</td>
                                    <td className="p-1.5 text-muted-foreground">
                                        {v
                                            ? v.quantity === null
                                                ? 'Unl.'
                                                : formatVariantQuantity(v)
                                            : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // Case 2: Two Dimensions (e.g. Size, Color)
    if (configs.length === 2) {
        const [rowConfig, colConfig] = configs; // e.g. Row=Size, Col=Color
        return (
            <div className="mt-2 overflow-hidden rounded-md border text-xs md:overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="p-1.5 font-medium">
                                {rowConfig.name} \ {colConfig.name}
                            </th>
                            {(colConfig.options || []).map((colOpt) => (
                                <th
                                    key={colOpt}
                                    className="p-1.5 font-medium whitespace-nowrap"
                                >
                                    {colOpt}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {(rowConfig.options || []).map((rowOpt) => (
                            <tr key={rowOpt}>
                                <td className="bg-muted/20 p-1.5 font-medium whitespace-nowrap">
                                    {rowOpt}
                                </td>
                                {(colConfig.options || []).map((colOpt) => {
                                    const v = getVariant({
                                        [rowConfig.name]: rowOpt,
                                        [colConfig.name]: colOpt,
                                    });
                                    return (
                                        <td
                                            key={`${rowOpt}-${colOpt}`}
                                            className="p-1.5 whitespace-nowrap text-muted-foreground"
                                        >
                                            {v
                                                ? v.quantity === null
                                                    ? 'Unl.'
                                                    : formatVariantQuantity(v)
                                                : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Case 3: > 2 Dimensions -> Simple Table
    return (
        <div className="mt-2 overflow-hidden rounded-md border text-xs md:overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-muted/50">
                    <tr>
                        {(configs || []).map((c) => (
                            <th key={c.name} className="p-1.5 font-medium">
                                {c.name}
                            </th>
                        ))}
                        <th className="p-1.5 font-medium">Stock</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {(product.variants || []).map((v, idx) => (
                        <tr key={v.id || idx}>
                            {(configs || []).map((c) => (
                                <td key={c.name} className="p-1.5">
                                    {(v.options || {})[c.name]}
                                </td>
                            ))}
                            <td className="p-1.5 text-muted-foreground">
                                {v.quantity === null
                                    ? 'Unl.'
                                    : formatVariantQuantity(v)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
