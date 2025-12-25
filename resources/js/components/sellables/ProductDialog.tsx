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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
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
}

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

    React.useEffect(() => {
        if (editingProduct) {
            setProductName(editingProduct.name);
            setProductPrice(editingProduct.price.toString());
            setProductDescription(editingProduct.description || '');
            setProductQuantity(
                editingProduct.quantity === -1
                    ? ''
                    : editingProduct.quantity?.toString() || '',
            );
            setProductVariableAmount(Boolean(editingProduct.variable_amount));
            setProductQuantityWithCard(
                editingProduct.quantity_with_card === -1
                    ? ''
                    : editingProduct.quantity_with_card?.toString() || '',
            );
            setProductQuantityWithoutCard(
                editingProduct.quantity_without_card === -1
                    ? ''
                    : editingProduct.quantity_without_card?.toString() || '',
            );
        } else {
            setProductName('');
            setProductPrice('');
            setProductDescription('');
            setProductQuantity('');
            setProductVariableAmount(false);
            setProductQuantityWithCard('');
            setProductQuantityWithoutCard('');
        }
    }, [editingProduct]);

    const submitProduct = () => {
        const data: any = {
            name: productName,
            price: parseFloat(productPrice),
            description: productDescription || null,
            variable_amount: productVariableAmount,
            quantity: productVariableAmount
                ? null
                : productQuantity
                  ? parseInt(productQuantity)
                  : null,
            quantity_with_card:
                productVariableAmount && productQuantityWithCard
                    ? parseInt(productQuantityWithCard)
                    : null,
            quantity_without_card:
                productVariableAmount && productQuantityWithoutCard
                    ? parseInt(productQuantityWithoutCard)
                    : null,
        };

        if (editingProduct) {
            router.put(`/sellables/products/${editingProduct.id}`, data, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
            });
        } else {
            router.post('/sellables/products', data, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto px-2 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
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
                            onChange={e => setProductName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="product-description">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="product-description"
                            value={productDescription}
                            onChange={e =>
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
                            onChange={e => setProductPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="product-quantity">
                            Quantity (optional)
                        </Label>
                        <Input
                            id="product-quantity"
                            type="number"
                            value={productQuantity}
                            onChange={e => setProductQuantity(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="product-variable-amount"
                            checked={productVariableAmount}
                            onCheckedChange={checked =>
                                setProductVariableAmount(checked === true)
                            }
                        />
                        <Label
                            htmlFor="product-variable-amount"
                            className="cursor-pointer"
                        >
                            Variable Amount (separate quantities for with/without
                            card)
                        </Label>
                    </div>
                    {productVariableAmount && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="product-quantity-with-card">
                                    Quantity with Card
                                </Label>
                                <Input
                                    id="product-quantity-with-card"
                                    type="number"
                                    value={productQuantityWithCard}
                                    onChange={e =>
                                        setProductQuantityWithCard(
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="product-quantity-without-card">
                                    Quantity without Card
                                </Label>
                                <Input
                                    id="product-quantity-without-card"
                                    type="number"
                                    value={productQuantityWithoutCard}
                                    onChange={e =>
                                        setProductQuantityWithoutCard(
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    )}
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
