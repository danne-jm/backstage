import { Head, Link } from '@inertiajs/react';
import { Instagram, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@store/components/ui/select';
import { useCart } from '@store/hooks/use-cart';
import ShopLayout from '@store/layouts/shop-layout';
import type { StoreItem } from '@store/types';

interface Props {
    item: StoreItem;
}

export default function ShopShow({ item }: Props) {
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [activeImage, setActiveImage] = useState(item.image);

    const increment = () => setQuantity((q) => q + 1);
    const decrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

    const handleOptionSelect = (attribute: string, value: string) => {
        setSelectedOptions((prev) => ({ ...prev, [attribute]: value }));
    };

    const currentVariant =
        item.variants_config && item.variants.length > 0
            ? item.variants.find((v) => {
                  const requiredKeys = item.variants_config!.map((c) => c.name);
                  return requiredKeys.every((key) => v.options[key] === selectedOptions[key]);
              })
            : null;

    const isSelectionComplete =
        !item.variants_config ||
        item.variants_config.length === 0 ||
        item.variants_config.every((c) => selectedOptions[c.name]);

    // Use has_stock from DTO — no numeric stock is leaked to frontend
    const isVariantSoldOut = currentVariant ? !currentVariant.has_stock : false;
    const isItemSoldOut = !item.has_stock;
    const isSoldOut = isVariantSoldOut || (!item.is_variant_based && isItemSoldOut);

    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = () => {
        if (item.variants_config && item.variants_config.length > 0 && !isSelectionComplete) {
            alert('Please select all options.');
            return;
        }

        addToCart({
            id: item.id,
            type: item.type,
            quantity,
            options: item.variants_config && item.variants_config.length > 0 ? selectedOptions : undefined,
        });

        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 1000);
    };

    const hasMultipleImages = item.images && item.images.length > 1;

    return (
        <ShopLayout>
            <Head title={item.name} />
            <div className="min-h-[calc(100vh-200px)] bg-white">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
                    <nav className="mb-4 flex items-center text-xs font-medium text-gray-500 sm:mb-8 sm:text-sm">
                        <Link href="/" className="hover:text-gray-900">Home</Link>
                        <span className="mx-1 sm:mx-2">/</span>
                        <Link href={`/?filter=${item.type}s#${item.type}-list`} className="capitalize hover:text-gray-900">
                            {item.type}s
                        </Link>
                        <span className="mx-1 sm:mx-2">/</span>
                        <span className="truncate text-gray-900">{item.name}</span>
                    </nav>

                    <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
                        {/* Image Column */}
                        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:gap-4 lg:mb-0">
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                                {activeImage ? (
                                    <img
                                        src={activeImage}
                                        alt={item.name}
                                        className="h-full w-full object-contain object-center"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400">
                                        <span className="text-sm">No Image</span>
                                    </div>
                                )}
                            </div>

                            {hasMultipleImages && (
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-4">
                                    {item.images.map((img) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setActiveImage(img.url)}
                                            className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all hover:opacity-100 ${
                                                activeImage === img.url
                                                    ? 'border-gray-100 opacity-100'
                                                    : 'border-transparent opacity-70'
                                            }`}
                                            aria-label={`View image ${item.images.indexOf(img) + 1}`}
                                        >
                                            <img
                                                src={img.url}
                                                alt=""
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details Column */}
                        <div className="flex flex-col">
                            <h1 className="mb-3 text-2xl font-bold tracking-tight text-black sm:mb-4 sm:text-4xl lg:text-5xl">
                                {item.name}
                            </h1>

                            <>
                                <p className="mb-4 text-2xl font-bold text-black sm:mb-8 sm:text-4xl">
                                    €{Number(item.price).toFixed(2)}
                                </p>

                                {item.member_price !== null &&
                                    item.member_price !== undefined &&
                                    item.member_price < item.price && (
                                        <div className="mb-4 rounded-r-lg border-l-4 border-emerald-500 bg-emerald-50 p-3 sm:mb-6 sm:p-4">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <h3 className="mb-1 text-sm font-semibold text-emerald-800">
                                                        ESNcard Discount Available
                                                    </h3>
                                                    <p className="text-sm text-emerald-700">
                                                        Get this {item.type} for just{' '}
                                                        <span className="font-bold">
                                                            €{Number(item.member_price).toFixed(2)}
                                                        </span>{' '}
                                                        with your ESNcard. Apply your discount code at checkout.
                                                    </p>
                                                    {item.is_variable && !item.has_stock_with_card && (
                                                        <p className="mt-2 text-sm font-bold text-red-600">
                                                            Note: Member price tickets are currently sold out.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {item.is_variable && !item.has_stock_without_card && (
                                    <div className="mb-4 rounded-md bg-yellow-50 p-3 sm:mb-6 sm:p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-yellow-800">Standard Price Sold Out</h3>
                                                <div className="mt-2 text-sm text-yellow-700">
                                                    <p>Standard tickets are sold out. Only member price tickets may be available.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {item.variants_config && item.variants_config.length > 0 && (
                                    <div className="mb-4 space-y-3 sm:mb-8 sm:space-y-4">
                                        {item.variants_config.map((attr) => (
                                            <div key={attr.name}>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    {attr.name.toUpperCase()}
                                                </label>
                                                <Select
                                                    value={selectedOptions[attr.name]}
                                                    onValueChange={(val) => handleOptionSelect(attr.name, val)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder={`Select ${attr.name}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {attr.options.map((opt) => (
                                                            <SelectItem key={opt} value={opt}>
                                                                {opt}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mb-4 sm:mb-8">
                                    <label htmlFor="quantity" className="mb-2 block text-sm font-medium text-gray-700">
                                        QUANTITY
                                    </label>
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-28 items-center border border-gray-300 sm:h-12 sm:w-32">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); decrement(); }}
                                                className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100 sm:w-10"
                                            >
                                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) =>
                                                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                                                }
                                                className="no-spinner h-full w-full flex-1 appearance-none border-none p-0 text-center text-sm font-medium text-black focus:ring-0 sm:text-base"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); increment(); }}
                                                className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100 sm:w-10"
                                            >
                                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </button>
                                        </div>
                                        {item.instagram_link && (
                                            <a
                                                href={item.instagram_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center transition-opacity hover:opacity-70"
                                                aria-label="View on Instagram"
                                            >
                                                <Instagram className="h-7 w-7 text-black sm:h-8 sm:w-8" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4 space-y-3 sm:mb-8 sm:space-y-4">
                                    {isSoldOut ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full cursor-not-allowed bg-gray-300 px-6 py-3 text-sm font-medium text-gray-500 uppercase focus:outline-none sm:px-8 sm:py-4 sm:text-base"
                                        >
                                            Sold Out
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={!isSelectionComplete}
                                            onClick={handleAddToCart}
                                            className={`flex w-full cursor-pointer items-center justify-center gap-2 border border-black px-6 py-3 text-sm font-medium text-black uppercase transition duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] focus:ring-0 focus:outline-none focus-visible:ring-0 sm:px-8 sm:py-4 sm:text-base ${!isSelectionComplete ? 'cursor-not-allowed bg-gray-100 opacity-50' : 'bg-white hover:bg-gray-50'} ${isAdded ? 'scale-105' : 'scale-100'}`}
                                        >
                                            {isAdded ? (
                                                <>
                                                    <span>Added!</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M20 6 9 17l-5-5" />
                                                    </svg>
                                                </>
                                            ) : (
                                                <>
                                                    {item.variants_config && item.variants_config.length > 0 && !isSelectionComplete
                                                        ? 'Select Options'
                                                        : 'Add to cart'}{' '}
                                                    <ShoppingCart className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </>

                            {item.type === 'event' && item.event_date && (
                                <div className="mb-4 border-b border-gray-200 pb-4 sm:mb-6 sm:pb-6">
                                    <h3 className="mb-1 text-xs font-medium text-gray-500 uppercase sm:text-sm">
                                        Event Date
                                    </h3>
                                    <p className="text-base font-semibold text-gray-900 sm:text-lg">
                                        {new Date(item.event_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            )}

                            <div className="prose prose-sm max-w-none text-gray-500">
                                <div dangerouslySetInnerHTML={{ __html: item.description || '' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
