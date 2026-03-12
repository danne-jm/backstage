import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TimePeriod } from '@/components/store-manager/latest-card-sales-list';
import type {
    BoardUser,
    Event,
    OfficeSale,
    OnlineSale,
    Product,
    Sellable,
} from '@/types/sellables';

const PAGE_SIZE = 100;

// Vibrant palette for chart series (mirrored in SalesChart, used here for sellable series colours)
const PALETTE = [
    '#3B82F6',
    '#F97316',
    '#EF4444',
    '#6366F1',
    '#06B6D4',
    '#A3E635',
    '#F59E0B',
    '#EC4899',
];

export function useStoreManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [boardUsers, setBoardUsers] = useState<BoardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<
        Array<{ date: string; office_total: number; online_total: number }>
    >([]);
    const [onlineSales, setOnlineSales] = useState<OnlineSale[]>([]);
    const [officeSales, setOfficeSales] = useState<OfficeSale[]>([]);
    const [onlineSalesTotal, setOnlineSalesTotal] = useState(0);
    const [onlineSellablesCount, setOnlineSellablesCount] = useState(0);
    const [period, setPeriod] = useState<TimePeriod>('7days');
    const [onlinePage, setOnlinePage] = useState(1);

    // ── Load data from the server ────────────────────────────────────────────

    const load = useCallback(
        async (page: number = 1, size: number = PAGE_SIZE) => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/store-manager/data?page=${page}&pageSize=${size}&period=${period}`,
                    { credentials: 'same-origin' },
                );
                if (!res.ok) return;

                const json = await res.json();

                if (Array.isArray(json.products))
                    setProducts(
                        json.products.map((p: any) => ({
                            ...p,
                            type: 'product' as const,
                        })),
                    );
                if (Array.isArray(json.events))
                    setEvents(
                        json.events.map((e: any) => ({
                            ...e,
                            type: 'event' as const,
                        })),
                    );
                if (Array.isArray(json.boardUsers))
                    setBoardUsers(json.boardUsers);
                if (Array.isArray(json.onlineSales))
                    setOnlineSales(json.onlineSales);
                if (Array.isArray(json.officeSales))
                    setOfficeSales(json.officeSales);

                setOnlineSellablesCount(json.onlineSellablesCount || 0);
                setOnlineSalesTotal(Number(json.onlineSalesTotal || 0));

                // Fetch sales chart summary
                const days =
                    period === 'month'
                        ? 30
                        : period === '7days'
                          ? 7
                          : period === '24hours'
                            ? 1
                            : period === 'lastShift'
                              ? 0
                              : 14;

                const hourly = period === '24hours';
                let summaryUrl = `/sales/summary?days=${days}${hourly ? '&hourly=true' : ''}`;

                if (period === 'lastShift' && json.lastClosedShiftDate) {
                    summaryUrl = `/sales/summary?from=${encodeURIComponent(json.lastClosedShiftDate)}`;
                }

                const sres = await fetch(summaryUrl, {
                    credentials: 'same-origin',
                });
                if (sres.ok) {
                    const sj = await sres.json();
                    setSales(sj.data || []);
                }
            } catch (e) {
                console.error('Failed to load store-manager data', e);
            } finally {
                setLoading(false);
            }
        },
        [period],
    );

    // ── Computed values ──────────────────────────────────────────────────────

    const sellables: Sellable[] = useMemo(
        () => [...products, ...events],
        [products, events],
    );

    const totalOffice = useMemo(
        () =>
            officeSales.reduce((acc, os) => {
                if (os.method === 'card') return acc;
                return acc + (parseFloat(String(os.amount || 0)) || 0);
            }, 0),
        [officeSales],
    );

    const totalOnline = useMemo(
        () =>
            onlineSales.reduce(
                (s, os) => s + (parseFloat(String(os.amount || 0)) || 0),
                0,
            ) +
            officeSales.reduce((acc, os) => {
                if (os.method !== 'card') return acc;
                return acc + (parseFloat(String(os.amount || 0)) || 0);
            }, 0),
        [onlineSales, officeSales],
    );

    const onlineSellableTotals = useMemo(() => {
        const onlineItems = sellables.filter((s) => s.is_online_sellable);
        return onlineItems
            .map((s) => {
                const total = onlineSales.reduce((acc, os) => {
                    const amount = parseFloat(String(os.amount || 0)) || 0;
                    if (s.type === 'product' && os.product_id === s.id)
                        return acc + amount;
                    if (s.type === 'event' && os.event_id === s.id)
                        return acc + amount;
                    return acc;
                }, 0);
                const count = onlineSales.reduce((acc, os) => {
                    if (s.type === 'product' && os.product_id === s.id)
                        return acc + 1;
                    if (s.type === 'event' && os.event_id === s.id)
                        return acc + 1;
                    return acc;
                }, 0);
                return { ...s, total, count };
            })
            .sort((a, b) => b.count - a.count);
    }, [sellables, onlineSales]);

    const dateKeys = useMemo(() => sales.map((s) => s.date), [sales]);
    const isHourlyData = dateKeys.length > 0 && dateKeys[0].includes(':');

    const onlineSellableSeries = useMemo(
        () =>
            onlineSellableTotals.map((s, idx) => {
                const series = dateKeys.map((dk) => {
                    return onlineSales.reduce((acc, os) => {
                        const soldAt = os.sold_at || '';
                        let matchKey: string;

                        if (isHourlyData) {
                            const d = new Date(soldAt);
                            const y = d.getFullYear();
                            const mo = String(d.getMonth() + 1).padStart(
                                2,
                                '0',
                            );
                            const dy = String(d.getDate()).padStart(2, '0');
                            const h = String(d.getHours()).padStart(2, '0');
                            matchKey = `${y}-${mo}-${dy} ${h}:00:00`;
                        } else {
                            matchKey = soldAt.split('T')[0].split(' ')[0];
                        }

                        if (matchKey !== dk) return acc;
                        if (s.type === 'product' && os.product_id === s.id)
                            return (
                                acc + (parseFloat(String(os.amount || 0)) || 0)
                            );
                        if (s.type === 'event' && os.event_id === s.id)
                            return (
                                acc + (parseFloat(String(os.amount || 0)) || 0)
                            );
                        return acc;
                    }, 0);
                });

                return { ...s, series, color: PALETTE[idx % PALETTE.length] };
            }),
        [onlineSellableTotals, dateKeys, isHourlyData, onlineSales],
    );

    const sellableCounts = useMemo(
        () =>
            onlineSellableTotals.map((s) => ({
                id: String(s.id),
                type: s.type,
                name: s.name,
                count: s.count,
            })),
        [onlineSellableTotals],
    );

    const totalOnlinePages = useMemo(
        () => Math.max(1, Math.ceil((onlineSalesTotal || 0) / PAGE_SIZE)),
        [onlineSalesTotal],
    );

    const visibleOnlineSales = useMemo(
        () =>
            (onlineSales || []).slice().sort((a, b) => {
                const ta = new Date(a.sold_at ?? '').getTime() || 0;
                const tb = new Date(b.sold_at ?? '').getTime() || 0;
                return tb - ta;
            }),
        [onlineSales],
    );

    // ── Mutations ────────────────────────────────────────────────────────────

    const handleSetOnline = useCallback(
        (sellableId: number, isOnline: boolean, type?: 'product' | 'event') => {
            const sellable = sellables.find(
                (s) => s.id === sellableId && (!type || s.type === type),
            );
            if (!sellable) return;

            const url =
                sellable.type === 'product'
                    ? `/sellables/products/${sellable.id}`
                    : `/sellables/events/${sellable.id}`;

            const data: any = {
                name: sellable.name,
                description: sellable.description,
                price:
                    sellable.type === 'product'
                        ? sellable.price
                        : (sellable as Event).price_with_card,
                quantity: sellable.quantity,
                variable_amount: sellable.variable_amount,
                quantity_with_card: sellable.quantity_with_card,
                quantity_without_card: sellable.quantity_without_card,
                is_online_sellable: isOnline,
            };

            if (sellable.type === 'event') {
                const ev = sellable as Event;
                data.price_with_card = ev.price_with_card;
                data.price_without_card = ev.price_without_card;
                data.event_date = ev.event_date;
                data.start_sell_date = ev.start_sell_date;
                data.end_sell_date = ev.end_sell_date;
                data.responsible_user_id = ev.responsible_user_id;
                data.notes = ev.notes;
                data.google_spreadsheet_id = ev.google_spreadsheet_id;
            }

            // Optimistic update
            if (sellable.type === 'product') {
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === sellable.id
                            ? { ...p, is_online_sellable: isOnline }
                            : p,
                    ),
                );
            } else {
                setEvents((prev) =>
                    prev.map((e) =>
                        e.id === sellable.id
                            ? { ...e, is_online_sellable: isOnline }
                            : e,
                    ),
                );
            }

            router.put(url, data, { preserveState: true, onSuccess: () => {} });
        },
        [sellables],
    );

    // ── Effects ──────────────────────────────────────────────────────────────

    useEffect(() => {
        load(onlinePage, PAGE_SIZE);
    }, [onlinePage, period, load]);

    // Realtime via Echo (Reverb)
    useEffect(() => {
        const w = window as any;
        if (typeof w === 'undefined' || !w.Echo) return;

        const channel = w.Echo.private('store-stats');

        channel.listen('StoreUpdated', (e: { sale?: OnlineSale }) => {
            if (e.sale) {
                setOnlineSales((prev) => [e.sale!, ...prev]);
                setOnlineSalesTotal((prev) => prev + 1);
            }
            load(onlinePage, PAGE_SIZE);
        });

        channel.listen(
            'SellableUpdated',
            (e: { sellable: Product | Event }) => {
                const s = e.sellable;
                if (s.type === 'product') {
                    setProducts((prev) => {
                        const idx = prev.findIndex((p) => p.id === s.id);
                        if (idx >= 0) {
                            const next = [...prev];
                            next[idx] = { ...next[idx], ...s } as Product;
                            return next;
                        }
                        return [...prev, s as Product].sort((a, b) =>
                            a.name.localeCompare(b.name),
                        );
                    });
                } else if (s.type === 'event') {
                    setEvents((prev) => {
                        const idx = prev.findIndex((ev) => ev.id === s.id);
                        if (idx >= 0) {
                            const next = [...prev];
                            next[idx] = { ...next[idx], ...s } as Event;
                            return next;
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
            w.Echo?.leave('store-stats');
        };
    }, [load, onlinePage]);

    return {
        // State
        loading,
        products,
        setProducts,
        events,
        setEvents,
        boardUsers,
        period,
        setPeriod,
        onlinePage,
        setOnlinePage,
        // Derived
        sellables,
        sales,
        onlineSales,
        officeSales,
        totalOffice,
        totalOnline,
        onlineSellableTotals,
        onlineSellableSeries,
        sellableCounts,
        onlineSalesTotal,
        onlineSellablesCount,
        totalOnlinePages,
        visibleOnlineSales,
        // Actions
        handleSetOnline,
        reload: load,
    };
}
