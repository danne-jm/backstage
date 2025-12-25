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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Store Manager',
        href: storeManager().url,
    },
];

interface Product {
    id: number;
    type: 'product';
    name: string;
    description: string | null;
    price: number;
    quantity?: number | null;
    variable_amount?: boolean;
    quantity_with_card?: number | null;
    quantity_without_card?: number | null;
    remaining: number;
    remaining_with_card?: number;
    remaining_without_card?: number;
    is_online_sellable: boolean;
}

interface Event {
    id: number;
    type: 'event';
    name: string;
    description: string | null;
    event_date: string;
    start_sell_date: string;
    end_sell_date: string;
    price_with_card: number;
    price_without_card: number;
    quantity: number | null;
    responsible_user_id?: number | null;
    notes: string | null;
    variable_amount: boolean;
    quantity_with_card: number | null;
    quantity_without_card: number | null;
    responsibleUser?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    remaining: number;
    remaining_with_card: number;
    remaining_without_card: number;
    is_online_sellable: boolean;
}

type Sellable = Product | Event;

interface BoardUser {
    id: number;
    name: string;
    email: string;
}

interface OnlineSale {
    id: number;
    product_id: number | null;
    event_id: number | null;
    method: string;
    amount: number;
    details: any;
    sold_at: string;
    product?: Product;
    event?: Event;
}

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

    const sellables: Sellable[] = [...products, ...events];

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Store Manager" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        {/* Sales chart */}
                        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                            <h3 className="mb-2 text-sm font-semibold">
                                Sales (last 14 days)
                            </h3>
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
                                            const maxVal = Math.max(
                                                ...sales.map(s =>
                                                    Math.max(
                                                        s.office_total,
                                                        s.online_total,
                                                    ),
                                                ),
                                                1,
                                            );

                                            const points = sales.map((s, i) => {
                                                const x =
                                                    pad +
                                                    (i /
                                                        Math.max(
                                                            1,
                                                            sales.length - 1,
                                                        )) *
                                                        w;
                                                const yOffice =
                                                    pad +
                                                    h -
                                                    (s.office_total / maxVal) *
                                                        h;
                                                const yOnline =
                                                    pad +
                                                    h -
                                                    (s.online_total / maxVal) *
                                                        h;
                                                return { x, yOffice, yOnline };
                                            });

                                            const pathOffice = points
                                                .map(
                                                    (p, i) =>
                                                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yOffice}`,
                                                )
                                                .join(' ');
                                            const pathOnline = points
                                                .map(
                                                    (p, i) =>
                                                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yOnline}`,
                                                )
                                                .join(' ');

                                            return (
                                                <>
                                                    <path
                                                        d={pathOffice}
                                                        fill="none"
                                                        stroke="#10B981"
                                                        strokeWidth={2}
                                                        strokeOpacity={0.9}
                                                    />
                                                    <path
                                                        d={pathOnline}
                                                        fill="none"
                                                        stroke="#3B82F6"
                                                        strokeWidth={2}
                                                        strokeOpacity={0.9}
                                                    />
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />{' '}
                                            Office: €{totalOffice.toFixed(2)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />{' '}
                                            Online: €{totalOnline.toFixed(2)}
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
                                        Total Online
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
                                                product={s as Product}
                                                onEdit={openProductDialog}
                                                variant="store-manager"
                                                isOnline={
                                                    s.is_online_sellable
                                                }
                                                onSetOnline={handleSetOnline}
                                            />
                                        ) : (
                                            <EventPreview
                                                key={s.id}
                                                event={s as Event}
                                                onEdit={openEventDialog}
                                                variant="store-manager"
                                                isOnline={
                                                    s.is_online_sellable
                                                }
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
                            Latest Online Sales
                        </h2>
                        {loading ? (
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        ) : (
                            <div className="space-y-4">
                                {onlineSales.map(sale => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div>
                                            <h3 className="font-medium">
                                                {sale.product?.name ||
                                                    sale.event?.name ||
                                                    'Unknown Item'}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {new Date(
                                                    sale.sold_at,
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-lg font-medium">
                                            €{sale.amount}
                                        </div>
                                    </div>
                                ))}
                                {onlineSales.length === 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        No online sales yet.
                                    </div>
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
