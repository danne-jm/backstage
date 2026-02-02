import { CartItem } from '@/hooks/useCart';
import { Link } from '@inertiajs/react';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemsListProps {
    sortedCart: CartItem[];
    updateQuantity: (
        id: number,
        type: 'product' | 'event',
        quantity: number,
        options?: Record<string, string> | undefined,
    ) => void;
    removeFromCart: (
        id: number,
        type: 'product' | 'event',
        options?: Record<string, string> | undefined,
    ) => void;
}

export function CartItemsList({
    sortedCart,
    updateQuantity,
    removeFromCart,
}: CartItemsListProps) {
    return (
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
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
                                src={item.image || '/images/product.png'}
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
                                            {Object.entries(item.options)
                                                .map(
                                                    ([key, val]) =>
                                                        `${key}: ${val}`,
                                                )
                                                .join(', ')}
                                        </div>
                                    )}
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        €{Number(item.price).toFixed(2)}
                                    </p>
                                    {item.description && (
                                        <div
                                            className="mt-1 hidden text-sm text-gray-500 sm:block"
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    item.description.length >
                                                    230
                                                        ? item.description.substring(
                                                              0,
                                                              230,
                                                          ) + '...'
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
                                                    item.quantity - 1,
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
                                                    item.quantity + 1,
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
            {sortedCart.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500 sm:text-base">
                    Your cart is empty.
                </p>
            )}
        </section>
    );
}
