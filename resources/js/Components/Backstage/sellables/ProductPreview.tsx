import { Button } from '@/Components/Shared/ui/button';
import { Checkbox } from '@/Components/Shared/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/Components/Shared/ui/dialog';
import { cn } from '@/lib/utils';

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
        <div className="relative rounded-lg border p-4">
            <div>
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

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(product)}
                            >
                                Edit
                            </Button>
                        )}
                        {variant === 'sellables' &&
                            onDelete &&
                            setProductToDelete && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:bg-muted/30"
                                        onClick={() =>
                                            setProductToDelete(product.id)
                                        }
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
                <div className="mt-1 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        {product.variants_config &&
                        product.variants_config.length > 0 ? (
                            <>
                                <span className="text-muted-foreground">
                                    Configurable by:
                                </span>{' '}
                                <span className="text-foreground">
                                    {product.variants_config
                                        .map((vc) => vc.name)
                                        .join(', ')}
                                </span>
                                {/* Variants Matrix or List */}
                                <div className="mt-2">
                                    {variant ===
                                    'store-manager' ? // Store Manager: Hide details, just show "Variants: Size, Color" (already shown above)
                                    null : (
                                        // Sellables: Show Matrix or List
                                        <VariantsMatrix product={product} />
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
                                      product.remaining_with_card !== null && (
                                          <span className="text-gray-500">
                                              {' '}
                                              | {
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
                                              | {
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
                                              | {product.remaining} remain
                                          </span>
                                      )}
                            </>
                        )}
                    </div>

                    {variant === 'store-manager' && onSetOnline && (
                        <div className="flex shrink-0 items-center space-x-2 sm:ml-4">
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
                                className="text-sm leading-none font-medium whitespace-nowrap peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
                    onOpenChange={(open) => !open && setProductToDelete(null)}
                >
                    <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{product.name}"?
                            This action cannot be undone.
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

            {/* Sell Online is rendered inline next to the quantity line above when in store-manager variant */}
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
                {product.variants.map((v, i) => (
                    <div
                        key={v.id || i}
                        className="text-xs text-muted-foreground"
                    >
                        •{' '}
                        {Object.entries(v.options)
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(', ')}
                        {' - '}
                        {v.quantity === null
                            ? 'Unlimited'
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
                if (v.options[key] !== val) return false;
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
                            <th className="p-2 font-medium">{config.name}</th>
                            <th className="p-2 font-medium">Stock</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {config.options.map((opt) => {
                            const v = getVariant({ [config.name]: opt });
                            return (
                                <tr key={opt}>
                                    <td className="p-2">{opt}</td>
                                    <td className="p-2 text-muted-foreground">
                                        {v
                                            ? v.quantity === null
                                                ? 'Unlimited'
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
                            <th className="p-2 font-medium">
                                {rowConfig.name} \ {colConfig.name}
                            </th>
                            {colConfig.options.map((colOpt) => (
                                <th
                                    key={colOpt}
                                    className="p-2 font-medium whitespace-nowrap"
                                >
                                    {colOpt}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rowConfig.options.map((rowOpt) => (
                            <tr key={rowOpt}>
                                <td className="bg-muted/20 p-2 font-medium whitespace-nowrap">
                                    {rowOpt}
                                </td>
                                {colConfig.options.map((colOpt) => {
                                    const v = getVariant({
                                        [rowConfig.name]: rowOpt,
                                        [colConfig.name]: colOpt,
                                    });
                                    return (
                                        <td
                                            key={`${rowOpt}-${colOpt}`}
                                            className="p-2 whitespace-nowrap text-muted-foreground"
                                        >
                                            {v
                                                ? v.quantity === null
                                                    ? 'Unlimited'
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
                        {configs.map((c) => (
                            <th key={c.name} className="p-2 font-medium">
                                {c.name}
                            </th>
                        ))}
                        <th className="p-2 font-medium">Stock</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {product.variants.map((v, idx) => (
                        <tr key={v.id || idx}>
                            {configs.map((c) => (
                                <td key={c.name} className="p-2">
                                    {v.options[c.name]}
                                </td>
                            ))}
                            <td className="p-2 text-muted-foreground">
                                {v.quantity === null
                                    ? 'Unlimited'
                                    : formatVariantQuantity(v)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
