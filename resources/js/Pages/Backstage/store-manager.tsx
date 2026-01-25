import { PlaceholderPattern } from '@/Components/Shared/ui/placeholder-pattern';
import AppLayout from '@/layouts/Backstage/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

import { EventDialog } from '@/Components/Backstage/sellables/EventDialog';
import { EventPreview } from '@/Components/Backstage/sellables/EventPreview';
import { ProductDialog } from '@/Components/Backstage/sellables/ProductDialog';
import { ProductPreview } from '@/Components/Backstage/sellables/ProductPreview';
import { LatestCardSalesList } from '@/Components/Backstage/store-manager/LatestCardSalesList';
import { SalesChart } from '@/Components/Backstage/store-manager/SalesChart';
import { StoreQuickStats } from '@/Components/Backstage/store-manager/StoreQuickStats';
import type {
    BoardUser,
    Event,
    OnlineSale,
    Product,
    Sellable,
} from '@/types/sellables';
import { useCallback, useEffect, useMemo, useState } from 'react';

type TimePeriod = '24hours' | '7days' | '14days' | 'month' | 'lastShift';

const periodLabels: Record<TimePeriod, string> = {
    '24hours': 'Last 24 hours',
    '7days': 'Last 7 days',
    '14days': 'Last 14 days',
    month: 'Last 30 days',
    lastShift: 'Since last shift',
};

export default function StoreManager() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Store Manager (Integrate real data with SumUp or other POS)',
            href: route('store-manager'),
        },
    ];

    const [products, setProducts] = useState<Product[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [boardUsers, setBoardUsers] = useState<BoardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<
        Array<{ date: string; office_total: number; online_total: number }>
    >([]);
    const [onlineSales, setOnlineSales] = useState<OnlineSale[]>([]);
    const [onlineSalesTotal, setOnlineSalesTotal] = useState<number>(0);
    const [onlineSellablesCount, setOnlineSellablesCount] = useState(0);
    const [period, setPeriod] = useState<TimePeriod>('7days');

    const { auth } = usePage<SharedData>().props;
    const permissions = auth?.user?.permissions || [];
    const canUpdateStore =
        permissions.includes('admin') ||
        permissions.includes('update_store_settings');

    // Product modal state
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Event modal state
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const load = useCallback(
        async (page: number = 1, size: number = 100) => {
            try {
                setLoading(true);
                const res = await fetch(
                    `/store-manager/data?page=${page}&pageSize=${size}&period=${period}`,
                    {
                        credentials: 'same-origin',
                    },
                );
                if (res.ok) {
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
                    setOnlineSellablesCount(json.onlineSellablesCount || 0);
                    setOnlineSalesTotal(Number(json.onlineSalesTotal || 0));

                    // Fetch sales summary matching the period
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
                    let summaryUrl = `/sales/summary?days=${days}&hourly=${hourly}`;

                    // Use the fresh lastClosedShiftDate from response
                    if (period === 'lastShift' && json.lastClosedShiftDate) {
                        summaryUrl = `/sales/summary?from=${json.lastClosedShiftDate}`;
                    }

                    const sres = await fetch(summaryUrl, {
                        credentials: 'same-origin',
                    });
                    if (sres.ok) {
                        const sj = await sres.json();
                        setSales(sj.data || []);
                    }
                }
            } catch (e) {
                console.error('Failed to load store-manager data', e);
            } finally {
                setLoading(false);
            }
        },
        [period],
    );

    const openProductDialog = (product?: Product) => {
        setEditingProduct(product || null);
        setProductDialogOpen(true);
    };

    const openEventDialog = (event?: Event) => {
        setEditingEvent(event || null);
        setEventDialogOpen(true);
    };

    const handleSetOnline = async (sellableId: number, isOnline: boolean) => {
        const sellable = sellables.find((s) => s.id === sellableId);
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
                    : sellable.price_with_card,
            quantity: sellable.quantity,
            variable_amount: sellable.variable_amount,
            quantity_with_card: sellable.quantity_with_card,
            quantity_without_card: sellable.quantity_without_card,
            is_online_sellable: isOnline,
        };

        if (sellable.type === 'event') {
            data.price_with_card = sellable.price_with_card;
            data.price_without_card = sellable.price_without_card;
            data.event_date = sellable.event_date;
            data.start_sell_date = sellable.start_sell_date;
            data.end_sell_date = sellable.end_sell_date;
            data.responsible_user_id = sellable.responsible_user_id;
            data.notes = sellable.notes;
            data.google_spreadsheet_id = sellable.google_spreadsheet_id;
        }

        router.put(url, data, {
            preserveState: true,
            onSuccess: () => load(),
        });
    };

    // Quick stats - uses onlineSales which is filtered by period
    const totalOffice = sales.reduce((s, r) => s + (r.office_total || 0), 0);
    const totalOnline = onlineSales.reduce(
        (s, os) => s + (parseFloat(String(os.amount || 0)) || 0),
        0,
    );

    const sellables: Sellable[] = [...products, ...events];

    // Compute recent online totals per active online sellable from onlineSales
    const onlineSellableTotals = (() => {
        const items = sellables.filter((s) => s.is_online_sellable);
        return items
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
            .sort((a, b) => b.count - a.count); // Sort by quantity (count) descending
    })();

    // Prepare per-sellable daily series and colors for chart + legend
    const palette = [
        '#3B82F6', // blue
        '#F97316', // orange
        '#EF4444', // red
        '#6366F1', // indigo
        '#06B6D4', // cyan
        '#A3E635', // lime
        '#F59E0B', // amber
        '#EC4899', // pink
    ];

    const dateKeys = sales.map((s) => s.date);

    const onlineSellableSeries = onlineSellableTotals.map((s, idx) => {
        const series = dateKeys.map((dk) => {
            const totalForDay = onlineSales.reduce((acc, os) => {
                const soldDate = (os.sold_at || '').split('T')[0];
                if (soldDate !== dk) return acc;
                if (s.type === 'product' && os.product_id === s.id)
                    return acc + (parseFloat(String(os.amount || 0)) || 0);
                if (s.type === 'event' && os.event_id === s.id)
                    return acc + (parseFloat(String(os.amount || 0)) || 0);
                return acc;
            }, 0);
            return totalForDay;
        });

        return {
            ...s,
            series,
            color: palette[idx % palette.length],
        };
    });

    const seriesMax = Math.max(
        1,
        ...onlineSellableSeries.flatMap((s) => s.series),
    );

    // Pagination for Latest Card Sales
    const pageSize = 100;
    const [onlinePage, setOnlinePage] = useState<number>(1);

    const totalOnlinePages = Math.max(
        1,
        Math.ceil((onlineSalesTotal || 0) / pageSize),
    );

    const sellableCounts = onlineSellableTotals.map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        count: s.count,
    }));

    // Server returns the paginated slice already; just sort the returned slice newest-first
    const visibleOnlineSales = useMemo(() => {
        return (onlineSales || []).slice().sort((a: any, b: any) => {
            const ta = new Date(a.sold_at ?? a.created_at).getTime() || 0;
            const tb = new Date(b.sold_at ?? b.created_at).getTime() || 0;
            return tb - ta; // newest first
        });
    }, [onlineSales]);

    // Load store-manager data once on mount and whenever pagination or period changes.
    useEffect(() => {
        load(onlinePage, pageSize);
    }, [onlinePage, pageSize, period, load]);

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Store Manager" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Sales chart */}
                        <SalesChart
                            loading={loading}
                            sales={sales}
                            onlineSales={onlineSales}
                            onlineSellableTotals={onlineSellableTotals}
                            onlineSellableSeries={onlineSellableSeries}
                            sellableCounts={sellableCounts}
                            seriesMax={seriesMax}
                        />

                        {/* Quick KPIs */}
                        <StoreQuickStats
                            totalOffice={totalOffice}
                            totalOnline={totalOnline}
                            onlineSellablesCount={onlineSellablesCount}
                            topSellerName={onlineSellableTotals[0]?.name ?? '—'}
                        />

                        {/* Sellables - this drives the row height */}
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <h3 className="mb-2 text-sm font-semibold">
                                Sellables
                            </h3>
                            {loading ? (
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            ) : (
                                <div className="max-h-96 space-y-2 overflow-y-auto">
                                    {sellables.map((s) =>
                                        s.type === 'product' ? (
                                            <ProductPreview
                                                key={s.id}
                                                product={s}
                                                onEdit={(p: Product) =>
                                                    openProductDialog(p)
                                                }
                                                variant="store-manager"
                                                isOnline={s.is_online_sellable}
                                                onSetOnline={
                                                    canUpdateStore
                                                        ? handleSetOnline
                                                        : undefined
                                                }
                                            />
                                        ) : (
                                            <EventPreview
                                                key={s.id}
                                                event={s}
                                                onEdit={(e: Event) =>
                                                    openEventDialog(e)
                                                }
                                                variant="store-manager"
                                                isOnline={s.is_online_sellable}
                                                onSetOnline={
                                                    canUpdateStore
                                                        ? handleSetOnline
                                                        : undefined
                                                }
                                            />
                                        ),
                                    )}
                                    {sellables.length === 0 && (
                                        <div className="text-xs text-muted-foreground">
                                            No data yet
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Latest Online Sales */}
                    <LatestCardSalesList
                        loading={loading}
                        onlineSales={onlineSales}
                        visibleOnlineSales={visibleOnlineSales}
                        onlinePage={onlinePage}
                        setOnlinePage={setOnlinePage}
                        totalOnlinePages={totalOnlinePages}
                        period={period}
                        setPeriod={setPeriod}
                        periodLabels={periodLabels}
                    />
                </div>
            </AppLayout>

            <ProductDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                editingProduct={editingProduct}
                onSuccess={load}
            />

            <EventDialog
                open={eventDialogOpen}
                onOpenChange={setEventDialogOpen}
                editingEvent={editingEvent}
                boardUsers={boardUsers}
                onSuccess={load}
            />
        </>
    );
}
