import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AnnouncementCarousel } from '@store/components/AnnouncementCarousel';
import { SellablePlaceholder } from '@store/components/SellablePlaceholder';
import type { AnnouncementSlide } from '@store/components/AnnouncementCarousel';
import ShopLayout from '@store/layouts/shop-layout';
import type { StoreSellable } from '@store/types';

interface Props {
    sellables: StoreSellable[];
}

export default function ShopHome({ sellables }: Props) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [activeFilter, setActiveFilter] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('filter') || 'all';
    });

    useEffect(() => {
        if (
            window.location.hash === '#product-list' ||
            window.location.hash === '#event-list'
        ) {
            const el = document.getElementById(window.location.hash.substring(1));
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 40;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    }, []);

    const announcementSlides: AnnouncementSlide[] = [
        {
            id: 'welcome',
            title: 'Welcome to the Web Shop!',
            subtitle:
                'Please ensure that you provide your email address accurately during checkout to facilitate communication regarding your order.\n\nApply your member card during checkout to unlock discounts on select items.\n\nYou will receive a reference code for every item you buy. Keep these close at hand, as you might have to provide them in the registration form!',
            image: '/images/social/esnstar.png',
            backgroundColor: '#000000ff',
            textColor: '#ffffff',
        },
        {
            id: 'esncard-promo',
            title: 'Get Your ESNcard Today!',
            subtitle:
                "Unlock exclusive benefits and discounts with the ESNcard. Available now for students in Leuven. Don't miss out on the perks – grab yours today!\n\nThe ESNcard is only for students in Leuven or coming to Leuven, please note that we can't sell an ESNcard to outgoing students.",
            image: '/images/product.png',
            backgroundColor: '#047857',
            textColor: '#ffffff',
        },
        {
            id: 'hoodie-promo',
            title: 'Stay Cozy with Our Exclusive Hoodies!',
            subtitle:
                "Experience comfort and style with our limited-edition ESN Leuven hoodies. Perfect for chilly days and showcasing your ESN pride. Get yours now before they're gone!",
            image: '/images/hoodie.jpeg',
            backgroundColor: '#9D174D',
            textColor: '#ffffff',
        },
    ];

    const formatAvailableFrom = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const filteredSellables = useMemo(() => {
        if (activeFilter === 'products') return sellables.filter((item) => item.type === 'product');
        if (activeFilter === 'events') return sellables.filter((item) => item.type === 'event');
        return sellables;
    }, [sellables, activeFilter]);

    const handleFilterChange = (filter: string) => {
        setActiveFilter(filter);
        const params = new URLSearchParams();
        if (filter !== 'all') params.set('filter', filter);
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
                <div className="mx-auto max-w-7xl px-2 pt-4 sm:px-4 sm:pt-8 lg:px-6">
                    <AnnouncementCarousel slides={announcementSlides} />
                </div>

                <div className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-8 lg:px-6">
                    <div className="mb-4 border-b border-gray-200 sm:mb-8">
                        <button
                            type="button"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-gray-900 focus:outline-none sm:py-4"
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
                                <div className="flex gap-2 pb-3 sm:gap-3 sm:pb-4">
                                    {(['all', 'products', 'events'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => handleFilterChange(filter)}
                                            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors sm:px-6 sm:text-base ${
                                                activeFilter === filter
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                        >
                                            {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        id={
                            activeFilter === 'products'
                                ? 'product-list'
                                : activeFilter === 'events'
                                  ? 'event-list'
                                  : undefined
                        }
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6"
                    >
                        {filteredSellables.map((item) => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                href={`/item/${item.type}/${item.id}`}
                                className="group relative flex flex-col"
                            >
                                <div className="h-48 w-full overflow-hidden rounded-lg sm:h-56 lg:h-64">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <SellablePlaceholder type={item.type} />
                                    )}
                                </div>
                                <div className="mt-2 flex flex-col sm:mt-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        <span aria-hidden="true" className="absolute inset-0" />
                                        {item.name}
                                    </h3>
                                    <p className="mt-1 text-base font-bold text-gray-900">
                                        €{Number(item.price).toFixed(2)}
                                    </p>
                                    {item.available_from ? (
                                        <p className="text-xs font-medium text-amber-600">
                                            Available {formatAvailableFrom(item.available_from)}
                                        </p>
                                    ) : !item.has_stock ? (
                                        <p className="text-xs font-medium text-red-600">Sold Out</p>
                                    ) : null}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredSellables.length === 0 && (
                        <div className="mt-8 text-center text-sm text-gray-500 sm:mt-12 sm:text-base">
                            No items currently available for sale.
                        </div>
                    )}
                </div>
            </div>
        </ShopLayout>
    );
}
