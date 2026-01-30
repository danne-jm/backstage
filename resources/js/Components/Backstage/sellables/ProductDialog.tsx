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

        if (!productVariableAmount) {
            if (productQuantity) formData.append('quantity', productQuantity);
            formData.append('unlimited_quantity', !productQuantity ? '1' : '0');
        } else {
            formData.append('unlimited_quantity', '0');
        }

        if (productVariableAmount) {
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

        // Append Variants
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
                    {variantsConfig.length === 0 && (
                        <>
                            <div>
                                <Label htmlFor="product-quantity">
                                    Quantity (optional)
                                </Label>
                                <Input
                                    id="product-quantity"
                                    type="number"
                                    value={productQuantity}
                                    onChange={(e) =>
                                        setProductQuantity(e.target.value)
                                    }
                                />
                            </div>
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
                        </>
                    )}
                    {variantsConfig.length === 0 && productVariableAmount && (
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
                                    value={productQuantityWithoutCard}
                                    onChange={(e) =>
                                        setProductQuantityWithoutCard(
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Variant Manager Moved Here */}
                    <div className="mt-4 border-t pt-4">
                        <Label className="mb-2 block text-base">Variants</Label>
                        <p className="mb-4 text-sm text-gray-500">
                            Add variants (e.g. Size, Color) to manage stock for
                            specific options.
                        </p>
                        <VariantManager
                            initialConfig={variantsConfig}
                            initialVariants={variants}
                            onChange={(newConfig, newVariants) => {
                                setVariantsConfig(newConfig);
                                setVariants(newVariants);
                                // If variants exist, clear main quantity to avoid confusion (optional, but safer to just disable)
                                if (newConfig.length > 0) {
                                    setProductQuantity('');
                                }
                            }}
                        />
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
