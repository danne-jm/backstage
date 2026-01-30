import { CartItem, useCart } from '@/hooks/useCart';
import ShopLayout from '@/layouts/Store/shop-layout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronDown,
    ChevronUp,
    Loader2,
    Mail,
    Minus,
    Plus,
    Ticket,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface Sellable {
    id: number;
    type: 'product' | 'event';
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    member_price?: number;
    is_online_sellable?: boolean;
    remaining: number | null;
    remaining_with_card?: number | null;
    remaining_without_card?: number | null;
    unlimited: boolean;
    unlimited_with_card?: boolean;
    unlimited_without_card?: boolean;
    is_variable?: boolean;
    variants?: {
        id: string;
        options: Record<string, string>;
        remaining: number | null;
    }[];
}

interface Props {
    sellables: Sellable[];
    processingFeeRate: number;
}

export default function ShopCart({ sellables, processingFeeRate }: Props) {
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
    const [email, setEmail] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cart_email') || '';
        }
        return '';
    });
    const [emailError, setEmailError] = useState<string | null>(null);

    const discountApplied = appliedDiscounts.length > 0;

    // Hydrate cart entries with full sellable data from backend
    const cart: CartItem[] = useMemo(() => {
        return entries
            .map((entry): CartItem | null => {
                const sellable = sellables.find(
                    (s) => String(s.id) === String(entry.id) && s.type === entry.type,
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

    // New Warning State derived from server
    const [serverBreakdown, setServerBreakdown] = useState<any[] | null>(null);
    const [serverTotal, setServerTotal] = useState<number | null>(null);

    // Debounce validation - just update totals, don't modify applied codes
    // (codes are validated when the user applies them)
    useEffect(() => {
        if (cart.length === 0) {
            setServerBreakdown([]);
            setServerTotal(0);
            return;
        }

        // Reset server values while calculating to avoid "stale" comparisons
        // (e.g. local total updates instantly to 20, stale server total is 10 -> shows fake discount)
        setServerTotal(null);

        const timer = setTimeout(async () => {
            try {
                const payload = {
                    items: cart.map((i) => ({
                        id: i.id,
                        type: i.type,
                        quantity: i.quantity,
                    })),
                    codes: appliedDiscounts,
                };
                const res = await axios.post('/validate-cart', payload);
                setServerBreakdown(res.data.breakdown);
                setServerTotal(res.data.total_final);
            } catch (e) {
                console.error('Validation failed', e);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [cart, appliedDiscounts]);

    // Validation Effect: Scrub invalid/unsellable items (local check)
    useEffect(() => {
        // 1. Identify items in cart that are no longer in sellables list (deleted or not online_sellable)
        const validIds = new Set(
            sellables
                .filter((s) => s.is_online_sellable !== false)
                .map((s) => `${s.type}-${s.id}`),
        );

        // We use the raw entries from useCart hook to check validity
        entries.forEach((entry) => {
            if (!validIds.has(`${entry.type}-${entry.id}`)) {
                // Determine if it was just set to not sellable or deleted
                const exists = sellables.find(
                    (s) => String(s.id) === String(entry.id) && s.type === entry.type,
                );
                if (exists && exists.is_online_sellable === false) {
                    setMessage({
                        text: `${exists.name} is no longer available for purchase and was removed from your cart.`,
                        type: 'error',
                    });
                }
                // Silently remove if it completely disappeared, or notify if explicit
                removeFromCart(entry.id, entry.type);
            }
        });
    }, [sellables, entries, removeFromCart]);

    // Derived state for warnings (don't block render, just calculations)
    const cartWarnings = useMemo(() => {
        const warnings: string[] = [];
        cart.forEach((item) => {
            const sellable = sellables.find(
                (s) => String(s.id) === String(item.id) && s.type === item.type,
            );
            if (!sellable) return;

            const isDiscounted =
                discountApplied &&
                item.member_price &&
                item.member_price < item.price;

            // Check specific stock
            // Check specific stock
            if (sellable.variants && sellable.variants.length > 0) {
                // Find matching variant
                const variant = sellable.variants.find((v) => {
                    const vOpts = v.options || {};
                    const iOpts = item.options || {};
                    const vKeys = Object.keys(vOpts);
                    const iKeys = Object.keys(iOpts);
                    if (vKeys.length !== iKeys.length) return false;
                    return vKeys.every((key) => vOpts[key] === iOpts[key]);
                });

                if (variant) {
                    if (variant.remaining !== null && variant.remaining < item.quantity) {
                        warnings.push(
                            `Insufficient stock for ${item.name} (${Object.values(variant.options).join(', ')}).`,
                        );
                    }
                }
            } else if (sellable.is_variable) {
                if (isDiscounted) {
                    // Check member stock
                    if (
                        !sellable.unlimited_with_card &&
                        (sellable.remaining_with_card ?? 0) < item.quantity
                    ) {
                        warnings.push(
                            `Insufficient stock for ${item.name} at Member Price.`,
                        );
                    }
                } else {
                    // Check normal stock
                    if (
                        !sellable.unlimited_without_card &&
                        (sellable.remaining_without_card ?? 0) < item.quantity
                    ) {
                        warnings.push(`Insufficient stock for ${item.name}.`);
                    }
                }
            } else {
                if (
                    !sellable.unlimited &&
                    (sellable.remaining ?? 0) < item.quantity
                ) {
                    warnings.push(`Insufficient stock for ${item.name}.`);
                }
            }
        });
        return warnings;
    }, [cart, sellables, discountApplied]);

    const handleApplyDiscount = async () => {
        const code = inputCode.trim().toUpperCase();
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

        setIsProcessing(true);
        setMessage(null);

        try {
            // Validate the code by calling the cart validation endpoint with just this code
            const payload = {
                items: cart.map((i) => ({
                    id: i.id,
                    type: i.type,
                    quantity: i.quantity,
                })),
                codes: [...appliedDiscounts, code],
            };
            const res = await axios.post('/validate-cart', payload);
            const validCodes: string[] = res.data.valid_codes || [];

            if (validCodes.includes(code)) {
                // Code is valid with ESNcard API - add it
                const newDiscounts = [...appliedDiscounts, code];
                setAppliedDiscounts(newDiscounts);
                localStorage.setItem(
                    'cart_discounts',
                    JSON.stringify(newDiscounts),
                );
                setInputCode('');
                setMessage({ text: 'Code applied!', type: 'success' });

                // Update server data
                setServerBreakdown(res.data.breakdown);
                setServerTotal(res.data.total_final);
            } else {
                // Code failed ESNcard API validation
                setMessage({
                    text: 'Invalid or expired ESNcard code.',
                    type: 'error',
                });
            }
        } catch (e) {
            console.error(e);
            setMessage({
                text: 'Failed to validate code. Please try again.',
                type: 'error',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const removeDiscount = (codeToRemove: string) => {
        const newDiscounts = appliedDiscounts.filter(
            (code) => code !== codeToRemove,
        );
        setAppliedDiscounts(newDiscounts);
        localStorage.setItem('cart_discounts', JSON.stringify(newDiscounts));
    };

    const originalTotal = cart.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
    );

    // Sort cart items by price descending (most expensive first)
    const sortedCart = [...cart].sort((a, b) => b.price - a.price);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError('Please enter your email address');
            return;
        }
        if (!emailRegex.test(email.trim())) {
            setEmailError('Please enter a valid email address');
            return;
        }
        setEmailError(null);
        localStorage.setItem('cart_email', email.trim());

        setIsProcessing(true);
        setMessage(null);

        try {
            // Build items array for checkout
            const items = cart.map((item) => ({
                id: item.id,
                type: item.type,
                quantity: item.quantity,
                options: item.options,
                use_member_price:
                    discountApplied &&
                    item.member_price &&
                    item.member_price < item.price,
            }));

            const response = await axios.post('/checkout', {
                items,
                discount_codes: appliedDiscounts,
                email: email.trim(),
            });

            if (response.data.success) {
                // Clear cart and discount codes
                clearCart();
                // Clear cart (but keep discount codes as requested)
                clearCart();
                // localStorage.removeItem('cart_discounts'); // Keep codes for future use

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
                <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        Shopping Cart
                    </h1>

                    <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
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
                                {sortedCart.map((item, idx) => (
                                    <li
                                        key={`${item.type}-${item.id}-${idx}`}
                                        className="flex py-4 sm:py-6 lg:py-10"
                                    >
                                        <div className="flex-shrink-0">
                                            <img
                                                src={
                                                    item.image ||
                                                    '/images/product.png'
                                                }
                                                alt={item.name}
                                                className="h-20 w-20 rounded-md object-contain object-center sm:h-32 sm:w-32 lg:h-48 lg:w-48"
                                            />
                                        </div>

                                        <div className="ml-3 flex flex-1 flex-col justify-between sm:ml-4 lg:ml-6">
                                            <div className="relative pr-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:pr-0 lg:gap-x-6">
                                                <div>
                                                    <div className="flex justify-between">
                                                        <h3 className="text-sm sm:text-base">
                                                            <Link
                                                                href={`/item/${item.type}/${item.id}`}
                                                                className="font-medium text-gray-700 hover:text-gray-800"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </h3>
                                                    </div>
                                                    {item.options && (
                                                        <div className="mt-1 text-xs text-gray-500 sm:text-sm">
                                                            {Object.entries(
                                                                item.options,
                                                            ).map(
                                                                ([key, val]) =>
                                                                    `${key}: ${val}`,
                                                            ).join(', ')}
                                                        </div>
                                                    )}
                                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                                        €
                                                        {Number(
                                                            item.price,
                                                        ).toFixed(2)}
                                                    </p>
                                                    {item.description && (
                                                        <div
                                                            className="mt-1 hidden text-sm text-gray-500 sm:block"
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

                                                <div className="mt-3 sm:mt-0 sm:pr-9">
                                                    <div className="flex h-8 w-24 items-center border border-gray-300 sm:h-10 sm:w-32">
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.type,
                                                                    item.quantity -
                                                                    1,
                                                                    item.options,
                                                                )
                                                            }
                                                            className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100 sm:w-10"
                                                        >
                                                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </button>
                                                        <span className="flex flex-1 items-center justify-center text-sm font-medium text-black">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    item.type,
                                                                    item.quantity +
                                                                    1,
                                                                    item.options,
                                                                )
                                                            }
                                                            className="flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100 sm:w-10"
                                                        >
                                                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="absolute top-0 right-0">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFromCart(
                                                                    item.id,
                                                                    item.type,
                                                                    item.options,
                                                                )
                                                            }
                                                            className="-m-1 inline-flex cursor-pointer p-1 text-gray-400 hover:text-gray-500 sm:-m-2 sm:p-2"
                                                        >
                                                            <span className="sr-only">
                                                                Remove
                                                            </span>
                                                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {cart.length === 0 && (
                                <p className="py-6 text-center text-sm text-gray-500 sm:text-base">
                                    Your cart is empty.
                                </p>
                            )}
                        </section>

                        {/* Order Summary */}
                        <section
                            aria-labelledby="summary-heading"
                            className="mt-8 rounded-lg bg-gray-50 px-4 py-4 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
                        >
                            <h2
                                id="summary-heading"
                                className="text-base font-medium text-gray-900 sm:text-lg"
                            >
                                Order summary
                            </h2>

                            <dl className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                                {/* Item Breakdown */}
                                {sortedCart.flatMap((item) =>
                                    Array.from({ length: item.quantity }).map(
                                        (_, i) => {
                                            return (
                                                <div
                                                    key={`${item.type}-${item.id}-${i}`}
                                                    className="flex flex-col border-b border-gray-100 py-2 last:border-0"
                                                >
                                                    <div className="flex w-full items-baseline justify-between gap-2">
                                                        <dt className="text-xs text-gray-600 sm:text-sm">
                                                            {item.name}
                                                        </dt>
                                                        <dd className="flex-shrink-0 text-right text-xs font-medium text-gray-900 sm:text-sm">
                                                            {(() => {
                                                                // Find server data for this item type
                                                                const sItem =
                                                                    serverBreakdown?.find(
                                                                        (s) =>
                                                                            s.id ===
                                                                            item.id &&
                                                                            s.type ===
                                                                            item.type,
                                                                    );

                                                                // Determine if THIS unit is discounted (greedy allocation: first N units)
                                                                const discountedCount =
                                                                    sItem?.discounted_quantity ||
                                                                    0;
                                                                const isUnitDiscounted =
                                                                    i <
                                                                    discountedCount;
                                                                const codeUsed =
                                                                    sItem
                                                                        ?.codes_applied?.[
                                                                    i
                                                                    ] ||
                                                                    (isUnitDiscounted
                                                                        ? 'Discount'
                                                                        : null);

                                                                // Calculate unit price
                                                                const unitRegularPrice =
                                                                    Number(
                                                                        item.price,
                                                                    );
                                                                const unitMemberPrice =
                                                                    Number(
                                                                        item.member_price ??
                                                                        item.price,
                                                                    );
                                                                // If finding member price fails locally, rely on server total?
                                                                // Better to use available data. If server says discounted, we assume member price is active.

                                                                if (
                                                                    isUnitDiscounted
                                                                ) {
                                                                    return (
                                                                        <div className="flex flex-col items-end gap-0.5">
                                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                                <span className="text-xs text-emerald-700">
                                                                                    {codeUsed &&
                                                                                        `(${codeUsed})`}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500 line-through">
                                                                                    €
                                                                                    {unitRegularPrice.toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </span>
                                                                                <span className="text-xs sm:text-sm">
                                                                                    €
                                                                                    {unitMemberPrice.toFixed(
                                                                                        2,
                                                                                    )}
                                                                                </span>
                                                                                <Ticket className="h-3 w-3 text-emerald-700" />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <span>
                                                                        €
                                                                        {unitRegularPrice.toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </dd>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    ),
                                )}

                                {/* Collapsible Discount Code */}
                                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsDiscountOpen(!isDiscountOpen)
                                        }
                                        className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-900 focus:outline-none"
                                    >
                                        <span>Discount Code</span>
                                        {isDiscountOpen ? (
                                            <ChevronUp className="h-4 w-4 text-gray-500 transition-transform duration-200 sm:h-5 sm:w-5" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200 sm:h-5 sm:w-5" />
                                        )}
                                    </button>

                                    <div
                                        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isDiscountOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                    >
                                        <div className="overflow-hidden p-1">
                                            <div className="mt-3 pb-1 sm:mt-4">
                                                {/* Applied Discounts Badges */}
                                                {appliedDiscounts.length >
                                                    0 && (
                                                        <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                                                            {appliedDiscounts.map(
                                                                (code) => (
                                                                    <span
                                                                        key={code}
                                                                        className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 sm:px-2.5 sm:text-sm"
                                                                    >
                                                                        {code}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeDiscount(
                                                                                    code,
                                                                                )
                                                                            }
                                                                            className="ml-1 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:bg-gray-500 focus:text-white focus:outline-none sm:ml-1.5 sm:h-4 sm:w-4"
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

                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        id="discount-code"
                                                        value={inputCode}
                                                        onChange={(e) =>
                                                            setInputCode(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="block w-full rounded-md border border-gray-300 p-2 text-sm text-black placeholder-gray-500 shadow-sm focus:border-black focus:ring-black"
                                                        placeholder="Enter ESNcard code"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleApplyDiscount
                                                        }
                                                        className="flex-shrink-0 rounded-md bg-gray-200 px-3 py-2 text-xs font-medium text-gray-900 hover:bg-gray-300 sm:px-4 sm:text-sm"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-baseline justify-between border-t border-gray-200 pt-3 sm:pt-4">
                                    <dt className="text-sm text-gray-600">
                                        Subtotal
                                    </dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        {serverTotal !== null ? (
                                            serverTotal < originalTotal ? (
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-xs text-gray-500 line-through">
                                                        €
                                                        {originalTotal.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                    <span className="mt-0.5 font-medium text-gray-900 sm:mt-1">
                                                        €
                                                        {Number(
                                                            serverTotal,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>
                                                    €
                                                    {Number(
                                                        serverTotal,
                                                    ).toFixed(2)}
                                                </span>
                                            )
                                        ) : (
                                            <span>
                                                €{originalTotal.toFixed(2)}
                                            </span>
                                        )}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between">
                                    <dt className="text-sm text-gray-600">
                                        Processing fee
                                    </dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        +€
                                        {(
                                            Number(
                                                serverTotal ?? originalTotal,
                                            ) * Number(processingFeeRate)
                                        ).toFixed(2)}
                                    </dd>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-200 pt-3 sm:pt-4">
                                    <dt className="text-sm font-medium text-gray-900 sm:text-base">
                                        Order total
                                    </dt>
                                    <dd className="text-xl font-bold text-gray-900 sm:text-2xl">
                                        €
                                        {(
                                            Number(
                                                serverTotal ?? originalTotal,
                                            ) *
                                            (1 + Number(processingFeeRate))
                                        ).toFixed(2)}
                                    </dd>
                                </div>
                            </dl>

                            {/* Email Input */}
                            <div className="mt-4 border-t border-gray-200 pt-4 sm:mt-6 sm:pt-6">
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Email address{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Your order confirmation will be sent here
                                </p>
                                <div className="relative mt-2">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Mail className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            localStorage.setItem('cart_email', e.target.value);
                                            if (emailError) setEmailError(null);
                                        }}
                                        className={`block w-full rounded-md border ${emailError ? 'border-red-300' : 'border-gray-300'} py-2 pl-9 text-sm text-black placeholder-gray-500 shadow-sm focus:border-black focus:ring-black sm:pl-10`}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                {emailError && (
                                    <p className="mt-1 text-xs text-red-600 sm:text-sm">
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            {message && (
                                <div
                                    className={`mt-3 rounded-md p-2.5 text-sm sm:mt-4 sm:p-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                                >
                                    {message.text}
                                </div>
                            )}

                            {cartWarnings.length > 0 && (
                                <div className="mt-3 rounded-md bg-yellow-50 p-2.5 text-sm text-yellow-700 sm:mt-4 sm:p-3">
                                    <p className="font-bold">
                                        Please adjust your cart:
                                    </p>
                                    <ul className="list-disc pl-5 text-xs sm:text-sm">
                                        {cartWarnings.map((w, i) => (
                                            <li key={i}>{w}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="mt-4 sm:mt-6">
                                <button
                                    type="button"
                                    disabled={
                                        cart.length === 0 ||
                                        isProcessing ||
                                        cartWarnings.length > 0 ||
                                        !email.trim()
                                    }
                                    onClick={handleCheckout}
                                    className="flex w-full items-center justify-center border border-transparent bg-black px-4 py-2.5 text-sm font-medium uppercase text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-base"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin sm:h-5 sm:w-5" />
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
