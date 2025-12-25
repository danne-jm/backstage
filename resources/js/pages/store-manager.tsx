import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { storeManager } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

import { useEffect, useState } from 'react';
import { ProductDialog } from '@/components/sellables/ProductDialog';
import { EventDialog } from '@/components/sellables/EventDialog';
import { ProductPreview } from '@/components/sellables/ProductPreview';
import { EventPreview } from '@/components/sellables/EventPreview';
import type { Product, Event, Sellable, BoardUser, OnlineSale } from '@/types/sellables';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Store Manager (Integrate real data with SumUp or other POS)',
        href: storeManager().url,
    },
];

// types moved to resources/js/types/sellables.ts

export default function StoreManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [boardUsers, setBoardUsers] = useState<BoardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<
        Array<{ date: string; office_total: number; online_total: number }>
    >([]);
    const [onlineSales, setOnlineSales] = useState<OnlineSale[]>([]);
    const [onlineSellablesCount, setOnlineSellablesCount] = useState(0);

    // Product modal state
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Event modal state
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    async function load() {
        try {
            setLoading(true);
            const res = await fetch('/store-manager/data', {
                credentials: 'same-origin',
            });
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
            }

            const sres = await fetch('/sales/summary?days=14', {
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
    }

    useEffect(() => {
        load();
    }, []);

    const openProductDialog = (product?: Product) => {
        setEditingProduct(product || null);
        setProductDialogOpen(true);
    };

    const openEventDialog = (event?: Event) => {
        setEditingEvent(event || null);
        setEventDialogOpen(true);
    };

    const handleSetOnline = async (
        sellableId: number,
        isOnline: boolean,
    ) => {
        const sellable = sellables.find(s => s.id === sellableId);
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

    // Quick stats
    const totalOffice = sales.reduce((s, r) => s + (r.office_total || 0), 0);
    const totalOnline = sales.reduce((s, r) => s + (r.online_total || 0), 0);

    // (online sellable totals computed below after `sellables` is defined)

    const sellables: Sellable[] = [...products, ...events];

    // Compute recent online totals per active online sellable from onlineSales
    const onlineSellableTotals = (() => {
        const items = sellables.filter(s => s.is_online_sellable);
        return items.map(s => {
            const total = onlineSales.reduce((acc, os) => {
                const amount = parseFloat(String(os.amount || 0)) || 0;
                if (s.type === 'product' && os.product_id === s.id) return acc + amount;
                if (s.type === 'event' && os.event_id === s.id) return acc + amount;
                return acc;
            }, 0);
            return { ...s, total };
        });
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

    const dateKeys = sales.map(s => s.date);

    const onlineSellableSeries = onlineSellableTotals.map((s, idx) => {
        const series = dateKeys.map(dk => {
            const totalForDay = onlineSales.reduce((acc, os) => {
                const soldDate = (os.sold_at || '').split('T')[0];
                if (soldDate !== dk) return acc;
                if (s.type === 'product' && os.product_id === s.id) return acc + (parseFloat(String(os.amount || 0)) || 0);
                if (s.type === 'event' && os.event_id === s.id) return acc + (parseFloat(String(os.amount || 0)) || 0);
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

    const seriesMax = Math.max(1, ...onlineSellableSeries.flatMap(s => s.series));

    const formatDateTime = (iso?: string | null) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'N/A';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Store Manager" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        {/* Sales chart */}
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">Sales (last 14 days)</h3>
                                {/* total computed from onlineSellableTotals below */}
                                <div className="text-sm font-medium">
                                    €{onlineSellableTotals.reduce((acc, s) => acc + (s.total || 0), 0).toFixed(2)}
                                </div>
                            </div>
                            {loading ? (
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            ) : (
                                <div className="h-40 w-full">
                                    <svg
                                        viewBox="0 0 300 80"
                                        className="h-full w-full"
                                    >
                                        {(() => {
                                            if (!sales || sales.length === 0)
                                                return null;
                                            const pad = 10;
                                            const w = 300 - pad * 2;
                                            const h = 80 - pad * 2;
                                            // Build per-sellable time series for the chart using the sales summary dates
                                            const dateKeys = sales.map(s => s.date);

                                            // Render each sellable's series using precomputed onlineSellableSeries
                                            return (
                                                <>
                                                    {onlineSellableSeries.map((s, idx) => {
                                                        const points = s.series.map((val: number, i: number) => {
                                                            const x = pad + (i / Math.max(1, dateKeys.length - 1)) * w;
                                                            const y = pad + h - (val / seriesMax) * h;
                                                            return { x, y };
                                                        });

                                                        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                                                        return (
                                                            <path
                                                                key={`series-${idx}`}
                                                                d={d}
                                                                fill="none"
                                                                stroke={s.color}
                                                                strokeWidth={2}
                                                                strokeOpacity={0.95}
                                                            />
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    {/* Legend: show a colored swatch per sellable series */}
                                    {/* <div className="mt-2 text-xs text-muted-foreground">
                                        {onlineSellableSeries.length > 0 ? (
                                            <div className="flex flex-wrap gap-4 items-center">
                                                {onlineSellableSeries.map(s => (
                                                    <div key={`legend-${s.type}-${s.id}`} className="flex items-center gap-2">
                                                        <span
                                                            className="h-2 w-2 rounded-full inline-block"
                                                            style={{ backgroundColor: s.color }}
                                                        />
                                                        <span>{s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" /> Online
                                            </div>
                                        )}
                                    </div> */}
                                    {/* Individual online sellables (recent online totals computed from onlineSales state) */}
                                    <div className="mt-3 text-xs">
                                        <div className="text-muted-foreground mb-1">
                                            Active online sellables
                                        </div>
                                        <div className="space-y-1">
                                            {onlineSellableTotals.length > 0 ? (
                                                onlineSellableTotals.map(s => {
                                                    const total = s.total || 0;
                                                    const overall = onlineSellableTotals.reduce((a, it) => a + (it.total || 0), 0) || 0;
                                                    const pct = overall === 0 ? 0 : (total / overall) * 100;
                                                    const seriesMeta = onlineSellableSeries.find(ss => ss.id === s.id && ss.type === s.type as any) as any;
                                                    const color = seriesMeta?.color ?? '#6B7280';

                                                    return (
                                                        <div
                                                            key={`online-sellable-${s.type}-${s.id}`}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="truncate flex items-center gap-2">
                                                                <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                                                                <span>{s.name}</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-3">
                                                                <div className="font-medium">€{total.toFixed(2)}</div>
                                                                <div className="text-muted-foreground">{pct.toFixed(1)}%</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-muted-foreground">
                                                    No active online sellables
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick KPIs */}
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <h3 className="mb-2 text-sm font-semibold">
                                Quick Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Total Office
                                    </div>
                                    <div className="mt-1 text-lg font-medium">
                                        €{totalOffice.toFixed(2)}
                                    </div>
                                </div>
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Total Card
                                    </div>
                                    <div className="mt-1 text-lg font-medium">
                                        €{totalOnline.toFixed(2)}
                                    </div>
                                </div>
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Online Sellables
                                    </div>
                                    <div className="mt-1 text-lg font-medium">
                                        {onlineSellablesCount}
                                    </div>
                                </div>
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-xs text-muted-foreground">
                                        Top Seller
                                    </div>
                                    <div className="mt-1 text-lg font-medium">
                                        {sellables[0]?.name ?? '—'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sellables */}
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <h3 className="mb-2 text-sm font-semibold">
                                Sellables
                            </h3>
                            {loading ? (
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            ) : (
                                <div className="max-h-96 space-y-2 overflow-y-auto">
                                    {sellables.map(s =>
                                        s.type === 'product' ? (
                                            <ProductPreview
                                                key={s.id}
                                                product={s}
                                                onEdit={(p: Product) =>
                                                    openProductDialog(p)
                                                }
                                                variant="store-manager"
                                                isOnline={s.is_online_sellable}
                                                onSetOnline={handleSetOnline}
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
                                                onSetOnline={handleSetOnline}
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
                    <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                        <h2 className="mb-4 text-lg font-semibold">
                            Latest Card Sales
                        </h2>
                        {loading ? (
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        ) : (
                            <div className="space-y-4">
                                {/* Limit to the 10 most recent sales and make the list vertically scrollable */}
                                {onlineSales.length > 0 ? (
                                    <div className="max-h-[70vh] overflow-y-auto space-y-4">
                                        {onlineSales.slice(0, 15).map((sale: any) => (
                                            <div
                                                key={sale.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <h3 className="font-medium">
                                                        {sale.product?.name || sale.event?.name || 'Unknown Item'}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {formatDateTime(sale.sold_at)}
                                                    </p>
                                                </div>
                                                <div className="text-lg font-medium">€{sale.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">No online sales yet.</div>
                                )}
                            </div>
                        )}
                    </div>
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
