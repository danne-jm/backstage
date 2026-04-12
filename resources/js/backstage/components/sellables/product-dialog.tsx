import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import * as React from 'react';
import { ImageManager } from '@backstage/components/sellables/image-manager';
import { SellableDialogBase } from '@backstage/components/sellables/sellable-dialog-base';
import { VariantManager } from '@backstage/components/sellables/variant-manager';
import { Button } from '@backstage/components/ui/button';
import { Checkbox } from '@backstage/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@backstage/components/ui/collapsible';

import { Input } from '@backstage/components/ui/input';
import { Label } from '@backstage/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';
import { Textarea } from '@backstage/components/ui/textarea';
import type {
    BoardUser,
    Product,
    SellableVariant,
    VariantConfigItem,
} from '@backstage/types/sellables';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduct: Product | null;
    boardUsers: BoardUser[];
    onSuccess: () => void;
    preserveState?: boolean;
}

export function ProductDialog({
    open,
    onOpenChange,
    editingProduct,
    boardUsers,
    onSuccess,
    preserveState = false,
}: ProductDialogProps) {
    const [productName, setProductName] = React.useState('');
    const [productPrice, setProductPrice] = React.useState('');
    const [productPriceWithCard, setProductPriceWithCard] = React.useState('');
    const [productPriceWithoutCard, setProductPriceWithoutCard] = React.useState('');
    const [priceMode, setPriceMode] = React.useState<'single' | 'esncard'>('single');
    const [productDescription, setProductDescription] = React.useState('');
    const [productQuantity, setProductQuantity] = React.useState('');
    const [startSellDate, setStartSellDate] = React.useState('');
    const [endSellDate, setEndSellDate] = React.useState('');

    // productVariableAmount derived from stockMode === 'esncard'
    const [productQuantityWithCard, setProductQuantityWithCard] =
        React.useState('');
    const [productQuantityWithoutCard, setProductQuantityWithoutCard] =
        React.useState('');

    // Online Store & Images
    const [isOnlineSellable, setIsOnlineSellable] = React.useState(false);
    const [isOnlineSectionOpen, setIsOnlineSectionOpen] = React.useState(false);
    const [isStockSectionOpen, setIsStockSectionOpen] = React.useState(true);
    const [imagesList, setImagesList] = React.useState<
        { id: number | string; url: string }[]
    >([]);
    const [newImages, setNewImages] = React.useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = React.useState<
        (number | string)[]
    >([]);
    const [responsibleUserIds, setResponsibleUserIds] = React.useState<string[]>(['']);
    const [instagramLink, setInstagramLink] = React.useState('');
    const [variantsConfig, setVariantsConfig] = React.useState<
        VariantConfigItem[]
    >([]);
    const [variants, setVariants] = React.useState<SellableVariant[]>([]);
    const [stockMode, setStockMode] = React.useState<'simple' | 'esncard' | 'variants'>(
        'simple',
    );
    const [hideUntilSale, setHideUntilSale] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setTimeout(() => {
                const firstError = document.querySelector('.error-scroll-marker');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        }
    }, [errors]);

    const toDatetimeLocal = (isoStr: string | null | undefined): string => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const formatToTwoDecimals = (value: string): string => {
        if (!value) return '';
        const normalized = value.replace(',', '.');
        const numeric = parseFloat(normalized);
        if (Number.isNaN(numeric)) return value;
        return numeric.toFixed(2);
    };

    React.useEffect(() => {
        if (editingProduct) {
            setProductName(editingProduct.name);
            const hasEsncardPricing = !!editingProduct.price_with_card || !!editingProduct.price_without_card;
            setPriceMode(hasEsncardPricing ? 'esncard' : 'single');
            setProductPrice(editingProduct.price.toString());
            setProductPriceWithCard(editingProduct.price_with_card?.toString() ?? '');
            setProductPriceWithoutCard(editingProduct.price_without_card?.toString() ?? '');
            setStartSellDate(toDatetimeLocal(editingProduct.start_sell_date));
            setEndSellDate(toDatetimeLocal(editingProduct.end_sell_date));
            setProductDescription(editingProduct.description || '');
            setProductQuantity(
                editingProduct.unlimited_quantity
                    ? ''
                    : editingProduct.remaining?.toString() || '',
            );
            setProductQuantityWithCard(
                editingProduct.unlimited_quantity_with_card
                    ? ''
                    : editingProduct.remaining_with_card?.toString() || '',
            );
            setProductQuantityWithoutCard(
                editingProduct.unlimited_quantity_without_card
                    ? ''
                    : editingProduct.remaining_without_card?.toString() || '',
            );
            setResponsibleUserIds(
                editingProduct.responsible_user_ids && editingProduct.responsible_user_ids.length > 0
                    ? editingProduct.responsible_user_ids.map(String)
                    : [''],
            );
            setIsOnlineSellable(editingProduct.is_online_sellable);
            setHideUntilSale(editingProduct.hide_until_sale ?? false);
            setImagesList(editingProduct.images_list || []);
            setNewImages([]);
            setImagesToDelete([]);
            setInstagramLink(editingProduct.instagram_link || '');
            setVariantsConfig(editingProduct.variants_config || []);
            setVariants(
                (editingProduct.variants || []).map((v) => ({
                    ...v,
                    quantity:
                        v.quantity !== null
                            ? (v.remaining ?? v.quantity)
                            : null,
                })),
            );
            if ((editingProduct.variants_config || []).length > 0) {
                setStockMode('variants');
            } else if (editingProduct.variable_amount) {
                setStockMode('esncard');
            } else {
                setStockMode('simple');
            }

            // Default Open States
            setIsOnlineSectionOpen(true);

            const isComplexStock =
                (editingProduct.variants_config || []).length > 0;
            const isMobile = window.matchMedia('(max-width: 640px)').matches;

            if (isMobile || !isComplexStock) {
                setIsStockSectionOpen(true);
            } else {
                setIsStockSectionOpen(false);
            }
        } else {
            setProductName('');
            setProductPrice('');
            setProductPriceWithCard('');
            setProductPriceWithoutCard('');
            setPriceMode('single');
            setStartSellDate('');
            setEndSellDate('');
            setProductDescription('');
            setProductQuantity('');
            setProductQuantityWithCard('');
            setProductQuantityWithoutCard('');
            setResponsibleUserIds(['']);
            setIsOnlineSellable(false);
            setHideUntilSale(false);
            setImagesList([]);
            setNewImages([]);
            setImagesToDelete([]);
            setInstagramLink('');
            setVariantsConfig([]);
            setVariants([]);
            setStockMode('simple');
            setIsOnlineSectionOpen(true);
            setIsStockSectionOpen(true);
        }
    }, [editingProduct, open]);

    const allImagesForDisplay = React.useMemo(() => {
        const existing = (imagesList || []).map((img) => ({
            ...img,
            isNew: false,
        }));
        const incoming = (newImages || []).map((file, idx) => ({
            id: -1 * (idx + 1),
            url: URL.createObjectURL(file),
            isNew: true,
            file,
        }));
        return [...existing, ...incoming];
    }, [imagesList, newImages]);

    const handleAddImages = (files: FileList) => {
        const filesArray = Array.from(files);
        setNewImages((prev) => [...prev, ...filesArray]);
    };

    const handleRemoveImage = (id: number | string) => {
        if (typeof id === 'number' && id < 0) {
            const indexToRemove = id * -1 - 1;
            setNewImages((prev) =>
                prev.filter((_, idx) => idx !== indexToRemove),
            );
        } else {
            // Server image
            setImagesToDelete((prev) => [...prev, id]);
            setImagesList((prev) => prev.filter((img) => img.id !== id));
        }
    };

    const submitProduct = () => {
        const formData = new FormData();
        formData.append('name', productName);
        const useEsncardPricing = priceMode === 'esncard';
        if (useEsncardPricing) {
            const basePrice = formatToTwoDecimals(
                productPriceWithoutCard || productPrice,
            );
            const withCard = formatToTwoDecimals(productPriceWithCard);
            const withoutCard = formatToTwoDecimals(productPriceWithoutCard);

            formData.append('price', basePrice);
            formData.append('price_with_card', withCard);
            formData.append('price_without_card', withoutCard);
        } else {
            const basePrice = formatToTwoDecimals(productPrice);
            formData.append('price', basePrice);
            formData.append('price_with_card', '');
            formData.append('price_without_card', '');
        }
        formData.append('start_sell_date', startSellDate);
        formData.append('end_sell_date', endSellDate);
        if (productDescription)
            formData.append('description', productDescription);
        const isEsncardSplit = stockMode === 'esncard';
        formData.append('variable_amount', isEsncardSplit ? '1' : '0');

        if (stockMode === 'simple') {
            if (productQuantity) {
                formData.append('remaining_quantity', productQuantity);
            }
            formData.append('unlimited_quantity', !productQuantity ? '1' : '0');
        } else {
            formData.append('unlimited_quantity', '0');
        }

        if (isEsncardSplit) {
            if (productQuantityWithCard) {
                formData.append(
                    'remaining_quantity_with_card',
                    productQuantityWithCard,
                );
            }
            formData.append(
                'unlimited_quantity_with_card',
                !productQuantityWithCard ? '1' : '0',
            );

            if (productQuantityWithoutCard) {
                formData.append(
                    'remaining_quantity_without_card',
                    productQuantityWithoutCard,
                );
            }
            formData.append(
                'unlimited_quantity_without_card',
                !productQuantityWithoutCard ? '1' : '0',
            );
        }

        const filteredUserIds = responsibleUserIds.filter(Boolean);
        filteredUserIds.forEach((id) => formData.append('responsible_user_ids[]', id));
        formData.append('is_online_sellable', isOnlineSellable ? '1' : '0');
        formData.append('hide_until_sale', hideUntilSale ? '1' : '0');
        if (instagramLink) formData.append('instagram_link', instagramLink);

        // Append images
        newImages.forEach((file) => {
            formData.append('images[]', file);
        });

        // Append deleted images
        imagesToDelete.forEach((id) => {
            formData.append('deleted_images[]', id.toString());
        });

        // Append Variants or Quantity based on mode
        if (stockMode === 'variants') {
            // mode: variants -> clear simple quantity
            formData.append('is_variant_based', '1');
            formData.append('quantity', '');
            formData.append('unlimited_quantity', '0');
            formData.set('variable_amount', '0');
            formData.append('quantity_with_card', '');
            formData.append('unlimited_quantity_with_card', '0');
            formData.append('quantity_without_card', '');
            formData.append('unlimited_quantity_without_card', '0');

            (variantsConfig || []).forEach((config, idx) => {
                formData.append(`variants_config[${idx}][name]`, config.name);
                (config.options || []).forEach((opt, optIdx) => {
                    formData.append(
                        `variants_config[${idx}][options][${optIdx}]`,
                        opt,
                    );
                });
            });

            (variants || []).forEach((variant, idx) => {
                // Append options
                Object.entries(variant.options || {}).forEach(
                    ([key, value]) => {
                        formData.append(
                            `variants_stock[${idx}][options][${key}]`,
                            value,
                        );
                    },
                );
                // Append quantity
                if (variant.quantity !== null) {
                    formData.append(
                        `variants_stock[${idx}][remaining_quantity]`,
                        variant.quantity.toString(),
                    );
                } else {
                    formData.append(
                        `variants_stock[${idx}][remaining_quantity]`,
                        '',
                    );
                }
            });
        } else {
            // mode: simple -> clear variants
            formData.append('is_variant_based', '0');
            formData.append('variants_config', '');
        }

        if (editingProduct) {
            formData.append('_method', 'PUT');
            router.post(`/sellables/products/${editingProduct.id}`, formData, {
                onSuccess: () => {
                    setErrors({});
                    onOpenChange(false);
                    onSuccess();
                },
                onError: (err) => {
                    setErrors(err);
                },
                forceFormData: true,
                preserveState: 'errors',
                preserveScroll: true,
            });
        } else {
            router.post('/sellables/products', formData, {
                onSuccess: () => {
                    setErrors({});
                    onOpenChange(false);
                    onSuccess();
                },
                onError: (err) => {
                    setErrors(err);
                },
                forceFormData: true,
                preserveState: 'errors',
                preserveScroll: true,
            });
        }
    };

    return (
        <SellableDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title={editingProduct ? 'Edit Product' : 'Add Product'}
            description={
                editingProduct
                    ? 'Update the product details below.'
                    : 'Enter the details for the new product.'
            }
            onSubmit={submitProduct}
            submitLabel={editingProduct ? 'Update Product' : 'Create Product'}
        >
            <div className="flex flex-col gap-6">
                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="product-name">Name</Label>
                        <Input
                            id="product-name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="mt-1"
                        />
                        {errors.name && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.name}</p>}
                    </div>
                    <div>
                        <Label htmlFor="product-description">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="product-description"
                            value={productDescription}
                            onChange={(e) =>
                                setProductDescription(e.target.value)
                            }
                            className="min-h-[120px]"
                        />
                        {errors.description && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.description}</p>}
                    </div>
                    {/* Pricing Section: separate container, similar style to Stock Management */}
                    <div className="rounded-lg border bg-muted/5 px-4 py-3 space-y-4">
                        {/* Pricing mode toggle — ESNcard option disabled when variants mode active */}
                        <div className="mb-0 flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold text-muted-foreground">Pricing</span>
                            <div
                                role="tablist"
                                aria-orientation="horizontal"
                                className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={priceMode === 'single'}
                                    onClick={() => {
                                        // Switch to single price view but keep any existing ESNcard values in memory
                                        setPriceMode('single');
                                    }}
                                    className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${priceMode === 'single' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    Single Price
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={priceMode === 'esncard'}
                                    onClick={() => setPriceMode('esncard')}
                                    className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${priceMode === 'esncard' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    ESNcard Pricing
                                </button>
                            </div>
                        </div>

                        {/* Single price field */}
                        {priceMode === 'single' && (
                            <div>
                                <Label htmlFor="product-price">Price (€)</Label>
                                <Input
                                    id="product-price"
                                    type="number"
                                    step="0.01"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    onBlur={() =>
                                        setProductPrice((prev) =>
                                            formatToTwoDecimals(prev),
                                        )
                                    }
                                    className="mt-1"
                                />
                                {errors.price && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.price}</p>}
                            </div>
                        )}

                        {/* ESNcard pricing fields — only when priceMode = esncard (auto-reset when variants active) */}
                        {priceMode === 'esncard' && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="product-price-with-card" className="text-sm">
                                        Price w/ ESNcard (€)
                                    </Label>
                                    <Input
                                        id="product-price-with-card"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={productPriceWithCard}
                                        onChange={(e) => setProductPriceWithCard(e.target.value)}
                                        onBlur={() =>
                                            setProductPriceWithCard((prev) =>
                                                formatToTwoDecimals(prev),
                                            )
                                        }
                                        placeholder="Discounted price"
                                        className="mt-1"
                                    />
                                    {errors.price_with_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.price_with_card}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="product-price-without-card" className="text-sm">
                                        Price w/o ESNcard (€)
                                    </Label>
                                    <Input
                                        id="product-price-without-card"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={productPriceWithoutCard}
                                        onChange={(e) => setProductPriceWithoutCard(e.target.value)}
                                        onBlur={() =>
                                            setProductPriceWithoutCard(
                                                (prev) =>
                                                    formatToTwoDecimals(prev),
                                            )
                                        }
                                        placeholder="Full price"
                                        className="mt-1"
                                    />
                                    {errors.price_without_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.price_without_card}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Responsible Users */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                        <Label>Responsible Users</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setResponsibleUserIds((prev) => [...prev, ''])}
                        >
                            <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {responsibleUserIds.map((uid, idx) => (
                            <div key={idx} className="flex gap-2">
                                <Select
                                    value={uid}
                                    onValueChange={(val) =>
                                        setResponsibleUserIds((prev) => {
                                            const next = [...prev];
                                            next[idx] = val;
                                            return next;
                                        })
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select board member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boardUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {responsibleUserIds.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 shrink-0"
                                        onClick={() =>
                                            setResponsibleUserIds((prev) => prev.filter((_, i) => i !== idx))
                                        }
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    {errors.responsible_user_ids && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.responsible_user_ids}</p>}
                </div>

                {/* Section 2: Sidebar Options */}
                <div className="space-y-4">
                    {/* Stock Management Collapsible */}
                    <Collapsible
                        open={isStockSectionOpen}
                        onOpenChange={setIsStockSectionOpen}
                        className="rounded-lg border bg-muted/5 px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold">
                                Stock Management
                            </Label>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    {isStockSectionOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent className="mt-4 space-y-4">
                            <div className="mb-3 flex items-center justify-between border-b pb-3">
                                <span className="text-sm text-muted-foreground">
                                    Type
                                </span>
                                <div
                                    role="tablist"
                                    aria-orientation="horizontal"
                                    className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={stockMode === 'simple'}
                                        onClick={() => setStockMode('simple')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'simple' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={stockMode === 'esncard'}
                                        onClick={() => setStockMode('esncard')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'esncard' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        ESNcard Split
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={stockMode === 'variants'}
                                        onClick={() => setStockMode('variants')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'variants' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        Variants
                                    </button>
                                </div>
                            </div>

                            {stockMode === 'simple' && (
                                <div>
                                    <Label
                                        htmlFor="product-quantity"
                                        className="text-sm"
                                    >
                                        {editingProduct ? 'Remaining Quantity' : 'Initial Quantity'}
                                    </Label>
                                    <Input
                                        id="product-quantity"
                                        type="number"
                                        min="0"
                                        value={productQuantity}
                                        onChange={(e) =>
                                            setProductQuantity(
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1"
                                        placeholder="Leave empty for unlimited"
                                    />
                                    {errors.remaining_quantity && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity}</p>}
                                </div>
                            )}

                            {stockMode === 'esncard' && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <Label
                                            htmlFor="product-quantity-with-card"
                                            className="text-sm"
                                        >
                                            {editingProduct ? 'Remaining With Card' : 'Initial With Card'}
                                        </Label>
                                        <Input
                                            id="product-quantity-with-card"
                                            type="number"
                                            min="0"
                                            value={productQuantityWithCard}
                                            onChange={(e) =>
                                                setProductQuantityWithCard(
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1"
                                            placeholder="Leave empty for unlimited"
                                        />
                                        {errors.remaining_quantity_with_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_with_card}</p>}
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="product-quantity-without-card"
                                            className="text-sm"
                                        >
                                            {editingProduct ? 'Remaining Without Card' : 'Initial Without Card'}
                                        </Label>
                                        <Input
                                            id="product-quantity-without-card"
                                            type="number"
                                            min="0"
                                            value={productQuantityWithoutCard}
                                            onChange={(e) =>
                                                setProductQuantityWithoutCard(
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1"
                                            placeholder="Leave empty for unlimited"
                                        />
                                        {errors.remaining_quantity_without_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_without_card}</p>}
                                    </div>
                                </div>
                            )}

                            {stockMode === 'variants' && (
                                <div className="pt-2">
                                    <VariantManager
                                        initialConfig={variantsConfig}
                                        initialVariants={variants}
                                        onChange={(newConfig, newVariants) => {
                                            setVariantsConfig(newConfig);
                                            setVariants(newVariants);
                                        }}
                                    />
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Online Store Collapsible */}
                    <Collapsible
                        open={isOnlineSectionOpen}
                        onOpenChange={setIsOnlineSectionOpen}
                        className="rounded-lg border px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <Label className="block text-base font-bold">
                                Online Store
                            </Label>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    {isOnlineSectionOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent className="mt-4 space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="online-sellable"
                                    checked={!!isOnlineSellable}
                                    onCheckedChange={(checked) =>
                                        setIsOnlineSellable(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="online-sellable"
                                    className="cursor-pointer font-medium"
                                >
                                    Sellable Online
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="product-hide-until-sale"
                                    checked={!!hideUntilSale}
                                    onCheckedChange={(checked) =>
                                        setHideUntilSale(checked === true)
                                    }
                                />
                                <div>
                                    <Label
                                        htmlFor="product-hide-until-sale"
                                        className="cursor-pointer font-medium"
                                    >
                                        Hide until sale starts
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        When unchecked, shows as a coming soon preview before the release date. When checked, hidden completely until sale begins.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="product-start-sell-date" className="text-sm">
                                        Release Date &amp; Time
                                    </Label>
                                    <Input
                                        id="product-start-sell-date"
                                        type="datetime-local"
                                        value={startSellDate}
                                        onChange={(e) => setStartSellDate(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">When it becomes purchasable</p>
                                </div>
                                <div>
                                    <Label htmlFor="product-end-sell-date" className="text-sm">
                                        End Date &amp; Time
                                    </Label>
                                    <Input
                                        id="product-end-sell-date"
                                        type="datetime-local"
                                        value={endSellDate}
                                        onChange={(e) => setEndSellDate(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">Leave empty for no end</p>
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 block text-sm font-medium">
                                    Product Images
                                </Label>
                                <ImageManager
                                    images={allImagesForDisplay}
                                    onRemoveImage={handleRemoveImage}
                                    onAddImages={handleAddImages}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    First image = cover
                                </p>
                            </div>

                            <div>
                                <Label
                                    htmlFor="product-instagram-link"
                                    className="text-sm"
                                >
                                    Instagram Link (optional)
                                </Label>
                                <Input
                                    id="product-instagram-link"
                                    type="url"
                                    value={instagramLink}
                                    onChange={(e) =>
                                        setInstagramLink(e.target.value)
                                    }
                                    placeholder="https://instagram.com/..."
                                    className="mt-1"
                                />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>
        </SellableDialogBase>
    );
}
