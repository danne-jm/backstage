import { ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';

import type { Product } from '@/types/sellables';

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

                        {/* Price: label muted, value prominent */}
                        <div className="mt-1 text-sm">
                            <span className="text-muted-foreground">
                                Price:
                            </span>{' '}
                            <span className="text-foreground">
                                {formatCurrency(product.price)}
                            </span>
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
                                        {product.unlimited_quantity_with_card ||
                                            product.quantity_with_card == null
                                            ? 'Unlimited'
                                            : product.quantity_with_card}
                                        {product.unlimited_quantity_with_card ||
                                            product.quantity_with_card == null
                                            ? false
                                            : product.remaining_with_card !==
                                            undefined &&
                                            product.remaining_with_card !==
                                            null && (
                                                <span className="text-gray-500">
                                                    {' '}
                                                    |{' '}
                                                    {
                                                        product.remaining_with_card
                                                    }{' '}
                                                    remain
                                                </span>
                                            )}{' '}
                                        |{' '}
                                        <span className="text-muted-foreground">
                                            w/o ESNcard:
                                        </span>{' '}
                                        {product.unlimited_quantity_without_card ||
                                            product.quantity_without_card == null
                                            ? 'Unlimited'
                                            : product.quantity_without_card}
                                        {product.unlimited_quantity_without_card ||
                                            product.quantity_without_card == null
                                            ? false
                                            : product.remaining_without_card !==
                                            undefined &&
                                            product.remaining_without_card !==
                                            null && (
                                                <span className="text-gray-500">
                                                    {' '}
                                                    |{' '}
                                                    {
                                                        product.remaining_without_card
                                                    }{' '}
                                                    remain
                                                </span>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <span className="text-muted-foreground">
                                            Quantity:
                                        </span>{' '}
                                        {product.unlimited_quantity ||
                                            product.quantity == null
                                            ? 'Unlimited'
                                            : product.quantity}
                                        {product.unlimited_quantity ||
                                            product.quantity == null
                                            ? false
                                            : product.remaining !== undefined &&
                                            product.remaining !== null && (
                                                <span className="text-gray-500">
                                                    {' '}
                                                    | {product.remaining}{' '}
                                                    remain
                                                </span>
                                            )}
                                    </>
                                )}

                                {/* Sell Online Checkbox - Inline with Quantity for Store Manager */}
                                {variant === 'store-manager' && onSetOnline && (
                                    <div className="mt-2 flex items-center gap-2">
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
                                        <label
                                            htmlFor={`online-${product.id}`}
                                            className="cursor-pointer text-xs font-medium text-muted-foreground"
                                        >
                                            Sell Online
                                        </label>
                                    </div>
                                )}
                            </div>
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
                    onOpenChange={(open) => !open && setProductToDelete(null)}
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
            )}
        </div>
    );
}

function VariantsMatrix({ product }: { product: Product }) {
    if (!product.variants || product.variants.length === 0) return null;

    // Helper to format quantity
    const formatVariantQuantity = (v: any) => {
        if (v.quantity === null) return 'Unl.';
        const sold = v.sold_count || 0;
        const remaining = v.quantity - sold;
        return `${remaining} / ${v.quantity}`;
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
