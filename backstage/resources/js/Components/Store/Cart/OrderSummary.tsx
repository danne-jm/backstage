import { CartItem } from '@/hooks/useCart';
import { ChevronDown, ChevronUp, Loader2, Mail, Ticket } from 'lucide-react';

interface OrderSummaryProps {
    sortedCart: CartItem[];
    appliedDiscounts: string[];
    inputCode: string;
    setInputCode: (value: string) => void;
    isDiscountOpen: boolean;
    setIsDiscountOpen: (value: boolean) => void;
    message: { text: string; type: 'success' | 'error' } | null;
    isProcessing: boolean;
    email: string;
    setEmail: (value: string) => void;
    emailError: string | null;
    setEmailError: (value: string | null) => void;
    serverBreakdown: any[] | null;
    serverTotal: number | null;
    originalTotal: number;
    processingFeeRate: number;
    cartWarnings: string[];
    handleApplyDiscount: () => void;
    removeDiscount: (code: string) => void;
    handleCheckout: () => void;
}

export function OrderSummary({
    sortedCart,
    appliedDiscounts,
    inputCode,
    setInputCode,
    isDiscountOpen,
    setIsDiscountOpen,
    message,
    isProcessing,
    email,
    setEmail,
    emailError,
    setEmailError,
    serverBreakdown,
    serverTotal,
    originalTotal,
    processingFeeRate,
    cartWarnings,
    handleApplyDiscount,
    removeDiscount,
    handleCheckout,
}: OrderSummaryProps) {
    return (
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
                    Array.from({ length: item.quantity }).map((_, i) => {
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
                                            const sItem = serverBreakdown?.find(
                                                (s) =>
                                                    s.id === item.id &&
                                                    s.type === item.type,
                                            );

                                            // Determine if THIS unit is discounted (greedy allocation: first N units)
                                            const discountedCount =
                                                sItem?.discounted_quantity || 0;
                                            const isUnitDiscounted =
                                                i < discountedCount;
                                            const codeUsed =
                                                sItem?.codes_applied?.[i] ||
                                                (isUnitDiscounted
                                                    ? 'Discount'
                                                    : null);

                                            // Calculate unit price
                                            const unitRegularPrice = Number(
                                                item.price,
                                            );
                                            const unitMemberPrice = Number(
                                                item.member_price ?? item.price,
                                            );
                                            // If finding member price fails locally, rely on server total?
                                            // Better to use available data. If server says discounted, we assume member price is active.

                                            if (isUnitDiscounted) {
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
                    }),
                )}

                {/* Collapsible Discount Code */}
                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <button
                        type="button"
                        onClick={() => setIsDiscountOpen(!isDiscountOpen)}
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
                                {appliedDiscounts.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
                                        {appliedDiscounts.map((code) => (
                                            <span
                                                key={code}
                                                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 sm:px-2.5 sm:text-sm"
                                            >
                                                {code}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeDiscount(code)
                                                    }
                                                    className="ml-1 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-500 focus:bg-gray-500 focus:text-white focus:outline-none sm:ml-1.5 sm:h-4 sm:w-4"
                                                >
                                                    <span className="sr-only">
                                                        Remove discount code{' '}
                                                        {code}
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
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="discount-code"
                                        value={inputCode}
                                        onChange={(e) =>
                                            setInputCode(e.target.value)
                                        }
                                        className="block w-full rounded-md border border-gray-300 p-2 text-sm text-black placeholder-gray-500 shadow-sm focus:border-black focus:ring-black"
                                        placeholder="Enter ESNcard code"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyDiscount}
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
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                        {serverTotal !== null ? (
                            serverTotal < originalTotal ? (
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="text-xs text-gray-500 line-through">
                                        €{originalTotal.toFixed(2)}
                                    </span>
                                    <span className="mt-0.5 font-medium text-gray-900 sm:mt-1">
                                        €{Number(serverTotal).toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <span>€{Number(serverTotal).toFixed(2)}</span>
                            )
                        ) : (
                            <span>€{originalTotal.toFixed(2)}</span>
                        )}
                    </dd>
                </div>

                <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Processing fee</dt>
                    <dd className="text-sm font-medium text-gray-900">
                        +€
                        {(
                            Number(serverTotal ?? originalTotal) *
                            Number(processingFeeRate)
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
                            Number(serverTotal ?? originalTotal) *
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
                    Email address <span className="text-red-500">*</span>
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
                    <p className="font-bold">Please adjust your cart:</p>
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
                        sortedCart.length === 0 ||
                        isProcessing ||
                        cartWarnings.length > 0 ||
                        !email.trim()
                    }
                    onClick={handleCheckout}
                    className="flex w-full items-center justify-center border border-transparent bg-black px-4 py-2.5 text-sm font-medium text-white uppercase shadow-sm hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-base"
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
    );
}
