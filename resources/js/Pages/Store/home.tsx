import ShopLayout from '@/layouts/Store/shop-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Sellable {
    id: string;
    type: 'product' | 'event';
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    price_without_card?: number;
    is_variable?: boolean;
    remaining: number | null;
    unlimited: boolean;
    event_date?: string;
    member_price?: number;
}

interface Props {
    sellables: Sellable[];
}

export default function ShopHome({ sellables }: Props) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Initialize filter state from URL but keep it managed locally for instant feedback
    const [activeFilter, setActiveFilter] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('filter') || 'all';
    });

    // Filter sellables based on active filter
    const filteredSellables = useMemo(() => {
        if (activeFilter === 'products') {
            return sellables.filter((item) => item.type === 'product');
        } else if (activeFilter === 'events') {
            return sellables.filter((item) => item.type === 'event');
        }
        return sellables;
    }, [sellables, activeFilter]);

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);

        const params = new URLSearchParams();
        if (filter !== 'all') {
            params.set('filter', filter);
        }

        const queryString = params.toString();
        router.visit(queryString ? `/?${queryString}` : '/', {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            only: ['sellables'],
        });
    };

    return (
        <ShopLayout>
            <Head title="Welcome" />
            <div className="bg-white">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Welcome to our Shop
                        </h1>
                        <p className="mt-3 text-lg text-gray-600">
                            Browse our latest products and events.
                        </p>
                    </div>

                    {/* Collapsible Filter Bar */}
                    <div className="mb-8 border-b border-gray-200">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-gray-900 focus:outline-none"
                        >
                            <span>Filter by Type</span>
                            {isFilterOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </button>

                        <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isFilterOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                            <div className="overflow-hidden">
                                <div className="flex gap-3 pb-4">
                                    <button
                                        onClick={() =>
                                            handleFilterChange('all')
                                        }
                                        className={`rounded-md px-6 py-2 font-medium transition-colors ${activeFilter === 'all'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleFilterChange('products')
                                        }
                                        className={`rounded-md px-6 py-2 font-medium transition-colors ${activeFilter === 'products'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        Products
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleFilterChange('events')
                                        }
                                        className={`rounded-md px-6 py-2 font-medium transition-colors ${activeFilter === 'events'
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        Events
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-12">
                        {filteredSellables.map((item) => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                href={`/item/${item.type}/${item.id}`}
                                className="group relative flex flex-col"
                            >
                                <div className="aspect-h-1 aspect-w-1 h-96 w-full overflow-hidden rounded-lg">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-300">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex flex-col">
                                    <h3 className="text-base font-semibold text-gray-900">
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-0"
                                        />
                                        {item.name}
                                    </h3>
                                    <p className="mt-1 text-lg font-bold text-gray-900">
                                        €{Number(item.price).toFixed(2)}
                                    </p>
                                    {!item.unlimited &&
                                        item.remaining !== null &&
                                        item.remaining <= 0 && (
                                            <p className="text-sm font-medium text-red-600">
                                                Sold Out
                                            </p>
                                        )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredSellables.length === 0 && (
                        <div className="mt-12 text-center text-gray-500">
                            No items currently available for sale.
                        </div>
                    )}
                </div>
            </div>
        </ShopLayout>
    );
}
