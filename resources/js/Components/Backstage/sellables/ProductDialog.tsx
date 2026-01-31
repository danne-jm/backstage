import { ImageManager } from '@/Components/Backstage/sellables/ImageManager';
import { VariantManager } from '@/Components/Backstage/sellables/VariantManager';
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
import { Input } from '@/Components/Shared/ui/input';
import { Label } from '@/Components/Shared/ui/label';
import { Textarea } from '@/Components/Shared/ui/textarea';
import type {
    Product,
    SellableVariant,
    VariantConfigItem,
} from '@/types/sellables';
import { router } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingProduct: Product | null;
    onSuccess: () => void;
}

export function ProductDialog({
    open,
    onOpenChange,
    editingProduct,
    onSuccess,
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

    React.useEffect(() => {
        if (editingProduct) {
            setProductName(editingProduct.name);
            setProductPrice(editingProduct.price.toString());
            setProductDescription(editingProduct.description || '');
            setProductQuantity(
                editingProduct.unlimited_quantity
                    ? ''
                    : editingProduct.quantity?.toString() || '',
            );
            setProductVariableAmount(Boolean(editingProduct.variable_amount));
            setProductQuantityWithCard(
                editingProduct.unlimited_quantity_with_card
                    ? ''
                    : editingProduct.quantity_with_card?.toString() || '',
            );
            setProductQuantityWithoutCard(
                editingProduct.unlimited_quantity_without_card
                    ? ''
                    : editingProduct.quantity_without_card?.toString() || '',
            );
            setIsOnlineSellable(editingProduct.is_online_sellable);
            setImagesList(editingProduct.images_list || []);
            setNewImages([]);
            setImagesToDelete([]);
            setImagesToDelete([]);
            setInstagramLink(editingProduct.instagram_link || '');
            setVariantsConfig(editingProduct.variants_config || []);
            setVariants(editingProduct.variants || []);
            setStockMode(
                (editingProduct.variants_config || []).length > 0
                    ? 'variants'
                    : 'simple',
            );
            setIsOnlineSectionOpen(false);
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
            setImagesToDelete([]);
            setInstagramLink('');
            setVariantsConfig([]);
            setVariants([]);
            setStockMode('simple');
            setIsOnlineSectionOpen(false);
        }
    }, [editingProduct, open]);

    const allImagesForDisplay = React.useMemo(() => {
        const existing = imagesList.map((img) => ({ ...img, isNew: false }));
        const incoming = newImages.map((file, idx) => ({
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
            if (productQuantity) formData.append('quantity', productQuantity);
            formData.append('unlimited_quantity', !productQuantity ? '1' : '0');
        } else {
            formData.append('unlimited_quantity', '0');
        }

        if (stockMode === 'simple' && productVariableAmount) {
            if (productQuantityWithCard)
                formData.append('quantity_with_card', productQuantityWithCard);
            formData.append(
                'unlimited_quantity_with_card',
                !productQuantityWithCard ? '1' : '0',
            );

            if (productQuantityWithoutCard)
                formData.append(
                    'quantity_without_card',
                    productQuantityWithoutCard,
                );
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

            variantsConfig.forEach((config, idx) => {
                formData.append(`variants_config[${idx}][name]`, config.name);
                config.options.forEach((opt, optIdx) => {
                    formData.append(
                        `variants_config[${idx}][options][${optIdx}]`,
                        opt,
                    );
                });
            });

            variants.forEach((variant, idx) => {
                // Append options
                Object.entries(variant.options).forEach(([key, value]) => {
                    formData.append(
                        `variants_stock[${idx}][options][${key}]`,
                        value,
                    );
                });
                // Append quantity
                if (variant.quantity !== null) {
                    formData.append(
                        `variants_stock[${idx}][quantity]`,
                        variant.quantity.toString(),
                    );
                } else {
                    formData.append(`variants_stock[${idx}][quantity]`, ''); // Empty string for unlimited/null
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
                    onOpenChange(false);
                    onSuccess();
                },
                forceFormData: true,
            });
        } else {
            router.post('/sellables/products', formData, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
                forceFormData: true,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
                <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add Product'}
                </DialogTitle>
                <DialogDescription>
                    {editingProduct
                        ? 'Update the product details below.'
                        : 'Enter the details for the new product.'}
                </DialogDescription>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="product-name">Name</Label>
                        <Input
                            id="product-name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
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
                            className="min-h-[100px]"
                        />
                    </div>
                    <div>
                        <Label htmlFor="product-price">Price (€)</Label>
                        <Input
                            id="product-price"
                            type="number"
                            step="0.01"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                        />
                    </div>
                    {/* Stock Management Section */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Label className="text-base font-semibold">
                                Stock Management
                            </Label>
                            <div
                                role="tablist"
                                aria-orientation="horizontal"
                                className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={stockMode === 'simple'}
                                    onClick={() => setStockMode('simple')}
                                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${stockMode === 'simple' ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                                >
                                    Simple Cap
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={stockMode === 'variants'}
                                    onClick={() => setStockMode('variants')}
                                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${stockMode === 'variants' ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                                >
                                    Variants
                                </button>
                            </div>
                        </div>

                        {stockMode === 'simple' && (
                            <div className="space-y-4 pt-2">
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
                                        className="cursor-pointer"
                                    >
                                        Variable Amount (separate quantities for
                                        with/without ESNcard)
                                    </Label>
                                </div>

                                {productVariableAmount ? (
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="product-quantity-with-card">
                                                Quantity with ESNcard
                                            </Label>
                                            <Input
                                                id="product-quantity-with-card"
                                                type="number"
                                                value={productQuantityWithCard}
                                                onChange={(e) =>
                                                    setProductQuantityWithCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="product-quantity-without-card">
                                                Quantity without ESNcard
                                            </Label>
                                            <Input
                                                id="product-quantity-without-card"
                                                type="number"
                                                value={
                                                    productQuantityWithoutCard
                                                }
                                                onChange={(e) =>
                                                    setProductQuantityWithoutCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="product-quantity">
                                            Quantity (optional)
                                        </Label>
                                        <p className="text-[0.8rem] text-muted-foreground">
                                            Leave empty for unlimited stock.
                                        </p>
                                        <Input
                                            id="product-quantity"
                                            type="number"
                                            value={productQuantity}
                                            onChange={(e) =>
                                                setProductQuantity(
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {stockMode === 'variants' && (
                            <div className="pt-2">
                                <p className="mb-4 text-sm text-gray-500">
                                    Define attributes (e.g. Size, Color) and set
                                    stock limits for each combination.
                                </p>
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
                    </div>

                    {/* Collapsible Online Store Section */}
                    <div className="rounded-md border">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                            onClick={() =>
                                setIsOnlineSectionOpen(!isOnlineSectionOpen)
                            }
                        >
                            <div className="text-sm font-semibold">
                                Online Store Options
                            </div>
                            {isOnlineSectionOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {isOnlineSectionOpen && (
                            <div className="space-y-4 border-t p-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="online-sellable"
                                        checked={!!isOnlineSellable}
                                        onCheckedChange={(checked) =>
                                            setIsOnlineSellable(
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="online-sellable"
                                        className="cursor-pointer"
                                    >
                                        Sellable Online
                                    </Label>
                                </div>

                                <div>
                                    <Label className="mb-2 block">
                                        Product Images
                                    </Label>
                                    <ImageManager
                                        images={allImagesForDisplay}
                                        onRemoveImage={handleRemoveImage}
                                        onAddImages={handleAddImages}
                                    />
                                    <p className="mt-2 text-[0.8rem] text-muted-foreground">
                                        First image will be the cover. Accepted
                                        formats: JPG, PNG.
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="product-instagram-link">
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
                                    />
                                </div>
                                <div className="border-t pt-4"></div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={submitProduct}>
                        {editingProduct ? 'Update Product' : 'Create Product'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
