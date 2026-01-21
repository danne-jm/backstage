import { CartItem, useCart } from '@/hooks/useCart';
import ShopLayout from '@/layouts/shop-layout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Minus,
    Plus,
    Ticket,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Sellable {
    id: number;
    type: 'product' | 'event';
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    member_price?: number;
}

interface Props {
    sellables: Sellable[];
}

export default function ShopCart({ sellables }: Props) {
    const { entries, removeFromCart, updateQuantity, clearCart } = useCart();
    const [appliedDiscounts, setAppliedDiscounts] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cart_discounts');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [inputCode, setInputCode] = useState('');
    const [isDiscountOpen, setIsDiscountOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('cart_discounts');
            return saved ? JSON.parse(saved).length > 0 : false;
        }
        return false;
    });
    const [message, setMessage] = useState<{
        text: string;
        type: 'success' | 'error';
    } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Hydrate cart entries with full sellable data from backend
    const cart: CartItem[] = useMemo(() => {
        return entries
            .map((entry) => {
                const sellable = sellables.find(
                    (s) => s.id === entry.id && s.type === entry.type,
                );
                if (!sellable) return null;
                return {
                    ...entry,
                    name: sellable.name,
                    description: sellable.description,
                    price: sellable.price,
                    image: sellable.image,
                    member_price: sellable.member_price,
                };
            })
            .filter((item): item is CartItem => item !== null);
    }, [entries, sellables]);

    const handleApplyDiscount = () => {
        const code = inputCode.trim();
        if (!code) {
            setMessage({ text: 'Please enter a code.', type: 'error' });
            return;
        }
        if (appliedDiscounts.includes(code)) {
            setMessage({
                text: 'This code is already applied.',
                type: 'error',
            });
            return;
        }

        const newDiscounts = [...appliedDiscounts, code];
        setAppliedDiscounts(newDiscounts);
        localStorage.setItem('cart_discounts', JSON.stringify(newDiscounts));
        setInputCode('');
        setMessage(null);
    };

    const removeDiscount = (codeToRemove: string) => {
        const newDiscounts = appliedDiscounts.filter(
            (code) => code !== codeToRemove,
        );
        setAppliedDiscounts(newDiscounts);
        localStorage.setItem('cart_discounts', JSON.stringify(newDiscounts));
    };

    const discountApplied = appliedDiscounts.length > 0;

    const originalTotal = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
    );
    const itemsSubtotal = cart.reduce((acc, item) => {
        const isDiscounted =
            discountApplied &&
            item.member_price &&
            item.member_price < item.price;
        const price =
            isDiscounted && item.member_price ? item.member_price : item.price;
        return acc + price * item.quantity;
    }, 0);

    const processingFee = itemsSubtotal * 0.02;
    const finalTotal = itemsSubtotal + processingFee;
    const savedAmount = originalTotal - itemsSubtotal;

    // Sort cart items by price descending (most expensive first)
    const sortedCart = [...cart].sort((a, b) => b.price - a.price);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        setMessage(null);

        try {
            // Build items array for checkout
            const items = cart.map((item) => ({
                id: item.id,
                type: item.type,
                quantity: item.quantity,
                use_member_price:
                    discountApplied &&
                    item.member_price &&
                    item.member_price < item.price,
            }));

            const response = await axios.post('/checkout', {
                items,
                discount_codes: appliedDiscounts,
            });

            if (response.data.success) {
                // Clear cart and discount codes
                clearCart();
                localStorage.removeItem('cart_discounts');

                // Redirect to confirmation page
                window.location.href = response.data.redirect_url;
            }
        } catch (error: any) {
            const stockErr = error?.response?.data?.errors?.stock;
            if (stockErr) {
                const text = Array.isArray(stockErr)
                    ? stockErr.join(' | ')
                    : String(stockErr);
                setMessage({ text, type: 'error' });
            } else {
                setMessage({
                    text: 'Checkout failed. Please try again.',
                    type: 'error',
                });
            }
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <ShopLayout>
            <Head title="Shopping Cart" />
            <div className="bg-white">
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Shopping Cart
                    </h1>

                    <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
                        <section
                            aria-labelledby="cart-heading"
                            className="lg:col-span-7"
                        >
                            <h2 id="cart-heading" className="sr-only">
                                Items in your shopping cart
                            </h2>

                            <ul
                                role="list"
                                className="divide-y divide-gray-200 border-t border-b border-gray-200"
                            >
                                {sortedCart.map((item) => (
                                    <li
                                        key={`${item.type}-${item.id}`}
                                        className="flex py-6 sm:py-10"
                                    >
                                        <div className="flex-shrink-0">
                                            <img
                                                src={
                                                    item.image ||
                                                    '/images/product.png'
                                                }
                                                alt={item.name}
                                                className="h-24 w-24 rounded-md object-contain object-center sm:h-48 sm:w-48"
                                            />
                                        </div>

                                        <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                                            <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                                <div>
                                                    <div className="flex justify-between">
                                                        <h3 className="text-sm">
                                                            <Link
                                                                href={`/item/${item.type}/${item.id}`}
                                                                className="font-medium text-gray-700 hover:text-gray-800"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </h3>
                                                    </div>
                                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                                        €
                                                        {Number(
                                                            item.price,
                                                        ).toFixed(2)}
                                                    </p>
                                                    {item.description && (
                                                        <div
                                                            className="mt-1 text-sm text-gray-500"
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    item
                                                                        .description
                                                                        .length >
                                                                    230
                                                                        ? item.description.substring(
                                                                              0,
                                                                              230,
                                                                          ) +
                                                                          '...'
                                                                        : item.description,
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                <div className="mt-4 sm:mt-0 sm:pr-9">
                                                    <div className="flex h-10 w-32 items-center border border-gray-300">
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.type,
                                                                    item.quantity -
                                                                        1,
                                                                )
                                                            }
                                                            className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100"
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <span className="flex flex-1 items-center justify-center font-medium text-black">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.type,
                                                                    item.quantity +
                                                                        1,
                                                                )
                                                            }
                                                            className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="absolute top-0 right-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFromCart(
                                                                    item.id,
                                                                    item.type,
                                                                )
                                                            }
                                                            className="-m-2 inline-flex cursor-pointer p-2 text-gray-400 hover:text-gray-500"
                                                        >
                                                            <span className="sr-only">
                                                                Remove
                                                            </span>
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {cart.length === 0 && (
                                <p className="py-6 text-center text-gray-500">
                                    Your cart is empty.
                                </p>
                            )}
                        </section>

                        {/* Order Summary */}
                        <section
                            aria-labelledby="summary-heading"
                            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
                        >
                            <h2
                                id="summary-heading"
                                className="text-lg font-medium text-gray-900"
                            >
                                Order summary
                            </h2>

                            <dl className="mt-6 space-y-4">
                                {/* Item Breakdown */}
                                {sortedCart.flatMap((item) =>
                                    Array.from({ length: item.quantity }).map(
                                        (_, i) => {
                                            const isDiscounted =
                                                discountApplied &&
                                                item.member_price &&
                                                item.member_price < item.price;
                                            const finalPrice = isDiscounted
                                                ? item.member_price!
                                                : item.price;

                                            return (
                                                <div
                                                    key={`${item.type}-${item.id}-${i}`}
                                                    className="flex flex-col border-b border-gray-100 py-2 last:border-0"
                                                >
                                                    <div className="flex w-full items-baseline justify-between">
                                                        <dt className="text-sm text-gray-600">
                                                            {item.name}
                                                        </dt>
                                                        <dd className="text-right text-sm font-medium text-gray-900">
                                                            {isDiscounted ? (
                                                                <span className="text-sm text-gray-500 line-through">
                                                                    €
                                                                    {Number(
                                                                        item.price,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                            ) : (
                                                                <span>
                                                                    €
                                                                    {Number(
                                                                        finalPrice,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </dd>
                                                    </div>
                                                    {isDiscounted && (
                                                        <div className="mt-2 flex w-full items-center justify-between">
                                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                                                                <Ticket className="mr-1 h-3 w-3" />
                                                                Discount
                                                                unlocked
                                                            </span>
                                                            <span className="text-sm font-bold text-black">
                                                                €
                                                                {Number(
                                                                    finalPrice,
                                                                ).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        },
                                    ),
                                )}

                                {/* Collapsible Discount Code */}
                                <div className="border-t border-gray-200 pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDiscountOpen(!isDiscountOpen)
                                        }
                                        className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-900 focus:outline-none"
                                    >
                                        <span>Discount Code</span>
                                        {isDiscountOpen ? (
                                            <ChevronUp className="h-5 w-5 text-gray-500 transition-transform duration-200" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200" />
                                        )}
                                    </button>

                                    <div
                                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isDiscountOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                    >
                                        <div className="overflow-hidden p-1">
                                            <div className="mt-4 pb-1">
                                                {/* Applied Discounts Badges */}
                                                {appliedDiscounts.length >
                                                    0 && (
                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        {appliedDiscounts.map(
                                                            (code) => (
                                                                <span
                                                                    key={code}
                                                                    className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800"
                                                                >
                                                                    {code}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeDiscount(
                                                                                code,
                                                                            )
                                                                        }
                                                                        className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:bg-gray-500 focus:text-white focus:outline-none"
                                                                    >
                                                                        <span className="sr-only">
                                                                            Remove
                                                                            discount
                                                                            code{' '}
                                                                            {
                                                                                code
                                                                            }
                                                                        </span>
                                                                        <svg
                                                                            className="h-2 w-2"
                                                                            stroke="currentColor"
                                                                            fill="none"
                                                                            viewBox="0 0 8 8"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeWidth="1.5"
                                                                                d="M1 1l6 6m0-6L1 7"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex space-x-2">
                                                    <input
                                                        type="text"
                                                        id="discount-code"
                                                        value={inputCode}
                                                        onChange={(e) =>
                                                            setInputCode(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="block w-full rounded-md border border-gray-300 p-2 text-black placeholder-gray-500 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                                                        placeholder="Enter ESNcard code"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleApplyDiscount
                                                        }
                                                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-baseline justify-between border-t border-gray-200 pt-4">
                                    <dt className="text-sm text-gray-600">
                                        Subtotal
                                    </dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        {discountApplied && savedAmount > 0 ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-gray-500 line-through">
                                                    €{originalTotal.toFixed(2)}
                                                </span>
                                                <span className="mt-1 font-medium text-gray-900">
                                                    €{itemsSubtotal.toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span>
                                                €{itemsSubtotal.toFixed(2)}
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">
                                        Processing fee
                                    </dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        +€{processingFee.toFixed(2)}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                                    <dt className="text-base font-medium text-gray-900">
                                        Order total
                                    </dt>
                                    <dd className="text-2xl font-bold text-gray-900">
                                        €{finalTotal.toFixed(2)}
                                    </dd>
                                </div>
                            </dl>

                            {message && (
                                <div
                                    className={`mt-4 rounded-md p-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="button"
                                    disabled={cart.length === 0 || isProcessing}
                                    onClick={handleCheckout}
                                    className="flex w-full items-center justify-center border border-transparent bg-black px-4 py-3 text-base font-medium text-white uppercase shadow-sm hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Proceed with payment'
                                    )}
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
