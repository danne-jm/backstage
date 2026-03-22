import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { ImageManager } from '@/components/sellables/image-manager';
import { SellableDialogBase } from '@/components/sellables/sellable-dialog-base';
import { VariantManager } from '@/components/sellables/variant-manager';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
    Product,
    SellableVariant,
    VariantConfigItem,
} from '@/types/sellables';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduct: Product | null;
    onSuccess: () => void;
    preserveState?: boolean;
}

export function ProductDialog({
    open,
    onOpenChange,
    editingProduct,
    onSuccess,
    preserveState = false,
}: ProductDialogProps) {
    const [productName, setProductName] = React.useState('');
    const [productPrice, setProductPrice] = React.useState('');
    const [productDescription, setProductDescription] = React.useState('');
    const [productQuantity, setProductQuantity] = React.useState('');

    const [productVariableAmount, setProductVariableAmount] =
        React.useState(false);
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
    const [instagramLink, setInstagramLink] = React.useState('');
    const [variantsConfig, setVariantsConfig] = React.useState<
        VariantConfigItem[]
    >([]);
    const [variants, setVariants] = React.useState<SellableVariant[]>([]);
    const [stockMode, setStockMode] = React.useState<'simple' | 'variants'>(
        'simple',
    );
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

    React.useEffect(() => {
        if (editingProduct) {
            setProductName(editingProduct.name);
            setProductPrice(editingProduct.price.toString());
            setProductDescription(editingProduct.description || '');
            setProductQuantity(
                editingProduct.unlimited_quantity
                    ? ''
                    : editingProduct.remaining?.toString() || '',
            );
            setProductVariableAmount(Boolean(editingProduct.variable_amount));
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
            setIsOnlineSellable(editingProduct.is_online_sellable);
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
                            ? Math.max(0, v.quantity - (v.sold_count || 0))
                            : null,
                })),
            );
            setStockMode(
                (editingProduct.variants_config || []).length > 0
                    ? 'variants'
                    : 'simple',
            );

            // Default Open States
            setIsOnlineSectionOpen(true);

            const isSimpleStock =
                !editingProduct.variants_config ||
                editingProduct.variants_config.length === 0;
            const isMobile = window.matchMedia('(max-width: 640px)').matches;

            if (isMobile || isSimpleStock) {
                setIsStockSectionOpen(true);
            } else {
                setIsStockSectionOpen(false);
            }
        } else {
            setProductName('');
            setProductPrice('');
            setProductDescription('');
            setProductQuantity('');
            setProductVariableAmount(false);
            setProductQuantityWithCard('');
            setProductQuantityWithoutCard('');
            setIsOnlineSellable(false);
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
        formData.append('price', productPrice);
        if (productDescription)
            formData.append('description', productDescription);
        formData.append('variable_amount', productVariableAmount ? '1' : '0');

        if (stockMode === 'simple' && !productVariableAmount) {
            if (productQuantity) {
                formData.append('remaining_quantity', productQuantity);
            }
            formData.append('unlimited_quantity', !productQuantity ? '1' : '0');
        } else {
            formData.append('unlimited_quantity', '0');
        }

        if (stockMode === 'simple' && productVariableAmount) {
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

        formData.append('is_online_sellable', isOnlineSellable ? '1' : '0');
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
            formData.append('variable_amount', '0');
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
                    <div>
                        <Label htmlFor="product-price">Price (€)</Label>
                        <Input
                            id="product-price"
                            type="number"
                            step="0.01"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            className="mt-1"
                        />
                        {errors.price && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.price}</p>}
                    </div>
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
                                        aria-selected={stockMode === 'variants'}
                                        onClick={() => setStockMode('variants')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'variants' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        Variants
                                    </button>
                                </div>
                            </div>

                            {stockMode === 'simple' && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="product-variable-amount"
                                            checked={!!productVariableAmount}
                                            onCheckedChange={(checked) =>
                                                setProductVariableAmount(
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="product-variable-amount"
                                            className="cursor-pointer text-sm"
                                        >
                                            Split by ESNcard
                                        </Label>
                                    </div>

                                    {productVariableAmount ? (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <Label
                                                    htmlFor="product-quantity-with-card"
                                                    className="text-sm"
                                                >
                                                    With Card
                                                </Label>
                                                <Input
                                                    id="product-quantity-with-card"
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        productQuantityWithCard
                                                    }
                                                    onChange={(e) =>
                                                        setProductQuantityWithCard(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                {errors.remaining_quantity_with_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_with_card}</p>}
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="product-quantity-without-card"
                                                    className="text-sm"
                                                >
                                                    Without Card
                                                </Label>
                                                <Input
                                                    id="product-quantity-without-card"
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        productQuantityWithoutCard
                                                    }
                                                    onChange={(e) =>
                                                        setProductQuantityWithoutCard(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                {errors.remaining_quantity_without_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_without_card}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label
                                                htmlFor="product-quantity"
                                                className="text-sm"
                                            >
                                                Quantity Total
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
