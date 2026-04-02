import { router } from '@inertiajs/react';
import * as React from 'react';
import { parseDate } from '@backstage/lib/utils';
import type { Product, Event } from '@backstage/types/sellables';

export function useSellables(
    initialProducts: Product[],
    initialEvents: Event[],
    expiredPaginationProp: any,
) {
    const [products, setProducts] = React.useState<Product[]>(initialProducts);
    const [events, setEvents] = React.useState<Event[]>(initialEvents);
    const [message, setMessage] = React.useState('');
    const [loadingExpired, setLoadingExpired] = React.useState(false);
    const [expiredPagination, setExpiredPagination] = React.useState(
        expiredPaginationProp || {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            has_more: false,
        },
    );

    const [expiredEventsState, setExpiredEventsState] = React.useState<Event[]>(
        () => {
            return (events || []).filter((ev) => {
                const d = parseDate(ev.end_sell_date);
                return !d ? true : d.getTime() < Date.now();
            });
        },
    );

    // Echo Integration
    React.useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        const channel = window.Echo.private('store-stats');

        channel.listen(
            'SellableUpdated',
            (e: { sellable: Product | Event }) => {
                const s = e.sellable;
                if (s.type === 'product') {
                    setProducts((prev) => {
                        const idx = prev.findIndex((p) => p.id === s.id);
                        if (idx >= 0) {
                            const newArr = [...prev];
                            newArr[idx] = { ...newArr[idx], ...s } as Product;
                            return newArr;
                        }
                        return [...prev, s as Product].sort((a, b) =>
                            a.name.localeCompare(b.name),
                        );
                    });
                } else if (s.type === 'event') {
                    setEvents((prev) => {
                        const idx = prev.findIndex((ev) => ev.id === s.id);
                        if (idx >= 0) {
                            const newArr = [...prev];
                            newArr[idx] = { ...newArr[idx], ...s } as Event;
                            return newArr;
                        }
                        return [...prev, s as Event].sort((a, b) =>
                            (a.event_date || '').localeCompare(
                                b.event_date || '',
                            ),
                        );
                    });
                }
            },
        );

        return () => {
            window.Echo?.leave('store-stats');
        };
    }, []);

    // Sync state when props change
    React.useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    React.useEffect(() => {
        setEvents(initialEvents);
    }, [initialEvents]);

    // Manage expired events state
    React.useEffect(() => {
        const nowMs = Date.now();
        const expiredFromCurrent = (events || []).filter((ev) => {
            const d = parseDate(ev.end_sell_date);
            return !d ? true : d.getTime() < nowMs;
        });

        setExpiredEventsState((prev) => {
            const map = new Map<number, Event>(
                (prev || []).map((e) => [e.id, e]),
            );
            expiredFromCurrent.forEach((e) => map.set(e.id, e));
            (events || []).forEach((e) => {
                const d = parseDate(e.end_sell_date);
                if (d && d.getTime() >= nowMs && map.has(e.id)) {
                    map.delete(e.id);
                }
            });
            return Array.from(map.values());
        });
    }, [events]);

    const notExpiredEvents = React.useMemo(() => {
        const list = (events || []).filter((ev) => {
            const d = parseDate(ev.end_sell_date);
            return d ? d.getTime() >= Date.now() : false;
        });
        return list.sort((a, b) => {
            const aDate = parseDate(a.event_date);
            const bDate = parseDate(b.event_date);
            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return aDate.getTime() - bDate.getTime();
        });
    }, [events]);

    const expiredEvents = React.useMemo(() => {
        return expiredEventsState.slice().sort((a, b) => {
            const aDate = parseDate(a.event_date);
            const bDate = parseDate(b.event_date);
            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;
            return bDate.getTime() - aDate.getTime();
        });
    }, [expiredEventsState]);

    const orderedEvents = [...notExpiredEvents, ...expiredEvents];

    async function loadMoreExpired() {
        if (!expiredPagination?.has_more || loadingExpired) return;
        const nextPage = (expiredPagination.current_page || 1) + 1;
        setLoadingExpired(true);
        try {
            const res = await fetch(
                `/sellables/expired?page=${nextPage}&per_page=${expiredPagination.per_page}`,
                {
                    credentials: 'same-origin',
                },
            );
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            const newItems: Event[] = Array.isArray(json.data) ? json.data : [];
            setExpiredEventsState((prev) => [...prev, ...newItems]);
            setExpiredPagination(json.pagination ?? { has_more: false });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingExpired(false);
        }
    }

    const deleteProduct = (productId: number) => {
        router.delete(`/sellables/products/${productId}`, {
            onSuccess: () => setMessage('Product deleted successfully'),
        });
    };

    const deleteEvent = (eventId: number) => {
        router.delete(`/sellables/events/${eventId}`, {
            onSuccess: () => setMessage('Event deleted successfully'),
        });
    };

    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    return {
        products,
        events,
        orderedEvents,
        expiredEvents,
        notExpiredEvents,
        message,
        setMessage,
        loadingExpired,
        expiredPagination,
        loadMoreExpired,
        deleteProduct,
        deleteEvent,
    };
}
