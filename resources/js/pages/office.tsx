import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { office } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, Pencil } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office',
        href: office().url,
    },
];

export default function Office() {
    const props = usePage<SharedData>().props;

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const products: any[] = Array.isArray(props['products'])
        ? props['products']
        : [];
    const sellables: any[] = Array.isArray(props['sellables'])
        ? props['sellables']
        : [];
    const pastShifts: any[] = Array.isArray(props['pastShifts'])
        ? props['pastShifts']
        : [];
    const denominations: string[] = Array.isArray(props['denominations'])
        ? props['denominations']
        : [];
    const now = new Date();

    // Prepare ordered sellables: products first (cheapest first), then events (active selling first by soonest end, then upcoming by start).
    const productItems = (products || [])
        .slice()
        .sort(
            (a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0),
        );

    const eventItemsRaw = (sellables || []).filter(
        (s: any) => s.type === 'event',
    );
    // exclude expired events (end_sell_date < now)
    const eventItems = eventItemsRaw.filter((e: any) => {
        if (!e.end_sell_date) return false;
        const end = new Date(e.end_sell_date);
        if (isNaN(end.getTime())) return false;
        return end.getTime() >= now.getTime();
    });

    // pastEvents intentionally omitted when not used to avoid unused-variable lint errors

    const activeEvents = eventItems
        .filter((e: any) => {
            if (!e.start_sell_date || !e.end_sell_date) return false;
            const start = new Date(e.start_sell_date);
            const end = new Date(e.end_sell_date);
            return (
                !isNaN(start.getTime()) &&
                !isNaN(end.getTime()) &&
                now.getTime() >= start.getTime() &&
                now.getTime() <= end.getTime()
            );
        })
        .sort(
            (a: any, b: any) =>
                new Date(a.end_sell_date).getTime() -
                new Date(b.end_sell_date).getTime(),
        );

    const upcomingEvents = eventItems
        .filter((e: any) => {
            if (!e.start_sell_date) return false;
            const start = new Date(e.start_sell_date);
            return !isNaN(start.getTime()) && start.getTime() > now.getTime();
        })
        .sort(
            (a: any, b: any) =>
                new Date(a.start_sell_date).getTime() -
                new Date(b.start_sell_date).getTime(),
        );

    const orderedSellables = [
        // map products into the same shape used for rendering below
        ...productItems.map((p: any) => ({
            ...p,
            type: 'product',
            id: `product_${p.id}`,
        })),
        ...activeEvents,
        ...upcomingEvents,
    ];

    const daysRemaining = (iso?: string | null) => {
        if (!iso) return 0;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 0;
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.ceil((d.getTime() - now.getTime()) / msPerDay);
    };

    const sellPeriodMessage = (
        startIso?: string | null,
        endIso?: string | null,
    ) => {
        const start = startIso ? new Date(startIso) : null;
        const end = endIso ? new Date(endIso) : null;
        if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime()))
            return '';

        if (now.getTime() < start.getTime()) {
            const days = daysRemaining(startIso);
            return `Start selling in ${days} ${days === 1 ? 'day' : 'days'}`;
        }

        if (now.getTime() <= end.getTime()) {
            const days = daysRemaining(endIso);
            return `Stop selling in ${days} ${days === 1 ? 'day' : 'days'}`;
        }

        return 'Sale ended';
    };

    const [message, setMessage] = React.useState('');
    const [isSaleEditOpen, setIsSaleEditOpen] = React.useState(false);
    const [editingSale, setEditingSale] = React.useState<any | null>(null);
    const [saleEditBreakdown, setSaleEditBreakdown] = React.useState<
        Record<string, number>
    >({
        '50': 0,
        '20': 0,
        '10': 0,
        '5': 0,
        '2': 0,
        '1': 0,
        '0_50': 0,
        '0_20': 0,
        '0_10': 0,
        token: 0,
    });
    // view-only cash breakdown modal for last shift
    const [isViewCashBreakdownOpen, setIsViewCashBreakdownOpen] =
        React.useState(false);
    const [isPollingPaused, setIsPollingPaused] = React.useState(false);

    // Edit cash breakdown modal state
    const [isEditCashBreakdownOpen, setIsEditCashBreakdownOpen] = React.useState(false);
    const [selectedShift, setSelectedShift] = React.useState<any | null>(null);
    const [breakdownForm, setBreakdownForm] = React.useState<Record<string, number>>({});

    const computeBreakdownTotal = (
        bd?: Record<string, number> | null,
    ): number => {
        if (!bd) return 0;
        const map: Record<string, number> = {
            '500e': 500,
            '200e': 200,
            '100e': 100,
            '50e': 50,
            '20e': 20,
            '10e': 10,
            '5e': 5,
            '2e': 2,
            '1e': 1,
            '50c': 0.50,
            '20c': 0.20,
            '10c': 0.10,
            '5c': 0.05,
            '2c': 0.02,
            '1c': 0.01,
        };
        return Object.keys(bd).reduce(
            (sum: number, k: string) =>
                sum + Number(bd[k] || 0) * (map[k] ?? 0),
            0,
        );
    };

    const handleEditClick = (shift: any) => {
        setSelectedShift(shift);
        setIsEditCashBreakdownOpen(true);
    };

    const handleBreakdownInputChange = (key: string, value: string) => {
        setBreakdownForm(prev => ({
            ...prev,
            [key]: parseInt(value) || 0
        }));
    };

    const handleBreakdownSave = () => {
        if (!selectedShift) return;

        router.post(`/office/${selectedShift.id}/update-cash-breakdown`, {
            breakdown: breakdownForm
        }, {
            onSuccess: () => setIsEditCashBreakdownOpen(false)
        });
    };

    const formatLabel = (key: string) => {
        if (key.endsWith('e')) return `€${key.slice(0, -1)}`;
        if (key.endsWith('c')) return `${key.slice(0, -1)}¢`;
        return key;
    };

    // When a shift is selected, populate the form with its existing data
    React.useEffect(() => {
        if (selectedShift) {
            const initialData: Record<string, number> = {};
            
            // Initialize all keys to 0
            denominations.forEach((key: string) => {
                initialData[key] = 0;
            });

            // Merge actual values from DB (handle missing keys gracefully)
            const dbData = selectedShift.cash_breakdown || {};
            Object.keys(dbData).forEach(key => {
                initialData[key] = dbData[key] ?? 0;
            });

            setBreakdownForm(initialData);
        }
    }, [selectedShift, denominations]);

    const openSaleEditModal = (sale: any) => {
        setEditingSale(sale);
        setSaleEditBreakdown({
            '50': 0,
            '20': 0,
            '10': 0,
            '5': 0,
            '2': 0,
            '1': 0,
            '0_50': 0,
            '0_20': 0,
            '0_10': 0,
            token: 0,
        });
        setIsSaleEditOpen(true);
    };
    const lastShiftRef = React.useRef<HTMLDivElement>(null);
    const [lastShiftHeight, setLastShiftHeight] = React.useState<number | null>(
        null,
    );

    // auto-dismiss messages
    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    // Track height of last shift section
    React.useEffect(() => {
        if (!lastShiftRef.current) return;

        const updateHeight = () => {
            if (lastShiftRef.current) {
                const height =
                    lastShiftRef.current.getBoundingClientRect().height;
                setLastShiftHeight(height);
            }
        };

        const initialTimer = setTimeout(updateHeight, 0);
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateHeight);
        });
        resizeObserver.observe(lastShiftRef.current);

        return () => {
            clearTimeout(initialTimer);
            resizeObserver.disconnect();
        };
    }, [lastShift]);

    const formatTimestamp = (iso?: string | null) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Summarize sales by base name (strip ticket variation like "(with ESN card)") and show events first
    const summarizeSales = (sales?: any[]) => {
        if (!Array.isArray(sales) || sales.length === 0) return '';

        const normalizeName = (sale: any) => {
            const raw = String(sale?.name ?? 'Unknown').trim();
            // strip trailing parenthetical (e.g. " (with ESN card)")
            return raw.replace(/\s*\(.*\)$/, '').trim();
        };

        const groups: Record<
            string,
            { name: string; count: number; isEvent: boolean }
        > = {};

        for (const s of sales) {
            const base = normalizeName(s);
            const isEvent = Boolean(
                s?.item_type === 'event' || s?.ticket_type || s?.ticket_label,
            );
            if (!groups[base]) groups[base] = { name: base, count: 0, isEvent };
            groups[base].count += 1;
            // if any item indicates event, consider the whole group an event
            if (isEvent) groups[base].isEvent = true;
        }

        const grouped = Object.values(groups);
        // Sort by ascending count (fewest sales first). Tie-break by name.
        grouped.sort((a, b) => {
            const diff = a.count - b.count;
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
        });

        return grouped.map((g) => `${g.name} ${g.count}`).join(' | ');
    };

    // Poll overview data so status, products and last shift update (every 2s)
    React.useEffect(() => {
        if (isPollingPaused) return;
        const interval = setInterval(() => {
            router.get(
                office().url,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [
                        'activeShift',
                        'lastShift',
                        'products',
                        'sellables',
                        'pastShifts',
                    ],
                },
            );
        }, 2000);

        return () => clearInterval(interval);
    }, [isPollingPaused]);

    // Filter pastShifts client-side to exclude the activeShift and the lastShift
    const filteredPastShifts = (pastShifts || []).filter(
        (s: any) => s.id !== lastShift?.id && s.id !== activeShift?.id,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                    <section
                        ref={lastShiftRef}
                        className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Last Office Shift
                            </h3>
                            {lastShift ? (
                                <Link href={`/office/${lastShift.id}`}>
                                    <Button size="sm" variant="ghost">
                                        Review
                                    </Button>
                                </Link>
                            ) : null}
                        </div>
                        {lastShift ? (
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Started
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatTimestamp(lastShift.started_at)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Ended
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatTimestamp(lastShift.ended_at)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Workers
                                    </div>
                                    <div className="text-sm">
                                        {Array.isArray(lastShift.workers) &&
                                        lastShift.workers.length > 0
                                            ? lastShift.workers
                                                  .map((w: any) => w.name)
                                                  .join(', ')
                                            : 'None'}
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">
                                        Start Money
                                    </div>
                                    <div className="mt-1 flex justify-between text-sm">
                                        <span>Cash:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.start_cash ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Card:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.start_card ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">
                                        End of Shift Money
                                    </div>
                                    <div className="mt-1 flex justify-between text-sm">
                                        <span>Cash:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.total_cash ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Card:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.total_card ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                                        <span>Total:</span>
                                        <span>
                                            €
                                            {(
                                                Number(
                                                    lastShift.total_cash ?? 0,
                                                ) +
                                                Number(
                                                    lastShift.total_card ?? 0,
                                                )
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                No office shifts available
                            </div>
                        )}
                    </section>

                    <section
                        className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                        style={{
                            height: lastShiftHeight
                                ? `${lastShiftHeight}px`
                                : 'auto',
                        }}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Sellables</h3>
                            <Link href="/sellables">
                                <Button size="sm" variant="ghost">
                                    Manage
                                </Button>
                            </Link>
                        </div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                            {orderedSellables.length > 0 ? (
                                orderedSellables.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                                    >
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">
                                                {item.name}
                                            </div>
                                            {item.description && (
                                                <div className="line-clamp-1 text-xs text-muted-foreground">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-2 flex flex-col items-end text-sm">
                                            <div className="font-medium text-muted-foreground">
                                                {item.type === 'product'
                                                    ? `€${Number(item.price).toFixed(2)}`
                                                    : `€${Number(item.price_with_card).toFixed(2)} / €${Number(item.price_without_card).toFixed(2)}`}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {item.type === 'event'
                                                    ? sellPeriodMessage(
                                                          item.start_sell_date,
                                                          item.end_sell_date,
                                                      )
                                                    : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No sellables available
                                </div>
                            )}
                        </div>
                    </section>

                    <section
                        className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                        style={{
                            height: lastShiftHeight
                                ? `${lastShiftHeight}px`
                                : 'auto',
                        }}
                    >
                        <h3 className="mb-3 text-sm font-semibold">
                            Office Shift Status
                        </h3>
                        {activeShift ? (
                            <div className="space-y-3">
                                <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                                    <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                                        Active Shift in Progress
                                    </div>
                                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        Started:{' '}
                                        {formatTimestamp(
                                            activeShift.started_at,
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Current Workers
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {Array.isArray(activeShift.workers) &&
                                        activeShift.workers.length > 0
                                            ? activeShift.workers
                                                  .map((w: any) => w.name)
                                                  .join(', ')
                                            : 'None'}
                                    </div>
                                </div>
                                <Link href={`/office/${activeShift.id}`}>
                                    <Button
                                        className="w-full"
                                        variant="default"
                                    >
                                        Manage Active Shift
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-sm font-medium">
                                        No Active Shift
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Start a new shift to begin tracking
                                        sales and workers
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    variant="default"
                                    onClick={() => {
                                        router.post(
                                            '/office/start',
                                            {},
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setTimeout(
                                                        () =>
                                                            router.get(
                                                                office().url,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                    replace: true,
                                                                },
                                                            ),
                                                        300,
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    Start Office Shift
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert>
                            <Check />
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                            Previous Shift Sales Log
                        </h3>
                        <div className="text-xs text-muted-foreground">
                            {lastShift && Array.isArray(lastShift.sales)
                                ? `${lastShift.sales.length} sales${lastShift.sales.length ? ' | ' + summarizeSales(lastShift.sales) : ''}`
                                : ''}
                        </div>
                    </div>

                    {lastShift &&
                        Array.isArray(lastShift.sales) &&
                        lastShift.sales.length > 0 && (
                            <>
                                <div className="overflow-x-auto">
                                    <div className="max-h-[14rem] overflow-y-auto">
                                        <table className="w-full table-fixed text-sm">
                                            <thead>
                                                <tr className="text-left text-xs text-muted-foreground">
                                                    <th className="w-1/12">
                                                        #
                                                    </th>
                                                    <th className="w-4/12">
                                                        Item
                                                    </th>
                                                    <th className="w-2/12">
                                                        Method
                                                    </th>
                                                    <th className="w-2/12">
                                                        Amount
                                                    </th>
                                                    <th className="w-3/12">
                                                        Description
                                                    </th>
                                                    <th className="w-2/12">
                                                        Sold by
                                                    </th>
                                                    <th className="w-2/12">
                                                        Sold at
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="mt-2">
                                                {(lastShift.sales || []).map(
                                                    (sale: any) => (
                                                        <tr
                                                            key={String(
                                                                sale.id,
                                                            )}
                                                            className="border-t"
                                                        >
                                                            <td className="py-3">
                                                                <span
                                                                    className="block max-w-[4rem] truncate"
                                                                    title={String(
                                                                        sale.id,
                                                                    )}
                                                                >
                                                                    {sale.id}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className="block max-w-[20rem] truncate"
                                                                    title={
                                                                        sale.name ??
                                                                        'N/A'
                                                                    }
                                                                >
                                                                    {sale.name ??
                                                                        'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 capitalize">
                                                                <span
                                                                    className="block max-w-[8rem] truncate"
                                                                    title={
                                                                        sale.method
                                                                    }
                                                                >
                                                                    {
                                                                        sale.method
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="block max-w-[8rem] truncate"
                                                                        title={`€${Number(sale.amount ?? 0).toFixed(2)}`}
                                                                    >
                                                                        €
                                                                        {Number(
                                                                            sale.amount ??
                                                                                0,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                    {String(
                                                                        sale.method,
                                                                    ).toLowerCase() ===
                                                                        'cash' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                openSaleEditModal(
                                                                                    sale,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className="block max-w-[20rem] truncate"
                                                                    title={
                                                                        sale.description ??
                                                                        ''
                                                                    }
                                                                >
                                                                    {sale.description ??
                                                                        ''}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className="block max-w-[16rem] truncate"
                                                                    title={
                                                                        sale.sold_by ??
                                                                        sale.sold_by_email ??
                                                                        sale.sold_by_id ??
                                                                        'Unknown'
                                                                    }
                                                                >
                                                                    {sale.sold_by ??
                                                                        sale.sold_by_email ??
                                                                        sale.sold_by_id ??
                                                                        'Unknown'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3">
                                                                <span
                                                                    className="block max-w-[12rem] truncate"
                                                                    title={
                                                                        sale.sold_at ??
                                                                        sale.created_at ??
                                                                        ''
                                                                    }
                                                                >
                                                                    {(sale.sold_at ??
                                                                    sale.created_at)
                                                                        ? new Date(
                                                                              sale.sold_at ??
                                                                                  sale.created_at,
                                                                          ).toLocaleString()
                                                                        : 'N/A'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-4">
                                        <div className="text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>Cash</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsViewCashBreakdownOpen(
                                                            true,
                                                        )
                                                    }
                                                    title="View cash distribution"
                                                >
                                                    ?
                                                </button>
                                            </div>
                                            <div className="font-medium">
                                                €
                                                {lastShift.sales
                                                    .filter(
                                                        (s: any) =>
                                                            String(
                                                                s.method,
                                                            ).toLowerCase() ===
                                                            'cash',
                                                    )
                                                    .reduce(
                                                        (sum: number, s: any) =>
                                                            sum +
                                                            Number(
                                                                s.amount ?? 0,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="text-sm">
                                            <div className="text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="font-medium">
                                                €
                                                {lastShift.sales
                                                    .filter(
                                                        (s: any) =>
                                                            String(
                                                                s.method,
                                                            ).toLowerCase() ===
                                                            'card',
                                                    )
                                                    .reduce(
                                                        (sum: number, s: any) =>
                                                            sum +
                                                            Number(
                                                                s.amount ?? 0,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="text-sm">
                                            <div className="text-muted-foreground">
                                                Total
                                            </div>
                                            <div className="font-semibold">
                                                €
                                                {lastShift.sales
                                                    .reduce(
                                                        (sum: number, s: any) =>
                                                            sum +
                                                            Number(
                                                                s.amount ?? 0,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sale edit modal for last shift */}
                                <Dialog
                                    open={isSaleEditOpen}
                                    onOpenChange={(v) => {
                                        setIsSaleEditOpen(v);
                                        if (!v) setEditingSale(null);
                                        setIsPollingPaused(v);
                                    }}
                                >
                                    <DialogContent>
                                        <DialogTitle>
                                            Edit cash transaction
                                        </DialogTitle>
                                        <DialogDescription>
                                            Adjust the cash denominations to
                                            change the sale amount.
                                        </DialogDescription>

                                        <div className="mt-4 grid grid-cols-1 gap-3">
                                            {[
                                                { key: '50', label: '€50' },
                                                { key: '20', label: '€20' },
                                                { key: '10', label: '€10' },
                                                { key: '5', label: '€5' },
                                                { key: '2', label: '€2' },
                                                { key: '1', label: '€1' },
                                                { key: '0_50', label: '50¢' },
                                                { key: '0_20', label: '20¢' },
                                                { key: '0_10', label: '10¢' },
                                                {
                                                    key: 'token',
                                                    label: 'Pink Token',
                                                },
                                            ].map((d) => (
                                                <div
                                                    key={d.key}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                            {d.label}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSaleEditBreakdown(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [d.key]:
                                                                            Math.max(
                                                                                0,
                                                                                (prev[
                                                                                    d
                                                                                        .key
                                                                                ] ||
                                                                                    0) -
                                                                                    1,
                                                                            ),
                                                                    }),
                                                                );
                                                            }}
                                                        >
                                                            -
                                                        </Button>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={String(
                                                                saleEditBreakdown[
                                                                    d.key
                                                                ] ?? 0,
                                                            )}
                                                            onChange={(e) => {
                                                                const v =
                                                                    Number(
                                                                        e.target
                                                                            .value ||
                                                                            0,
                                                                    );
                                                                setSaleEditBreakdown(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [d.key]:
                                                                            Math.max(
                                                                                0,
                                                                                Math.floor(
                                                                                    v,
                                                                                ),
                                                                            ),
                                                                    }),
                                                                );
                                                            }}
                                                            className="w-20 rounded-md border p-1 text-right"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSaleEditBreakdown(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [d.key]:
                                                                            (prev[
                                                                                d
                                                                                    .key
                                                                            ] ||
                                                                                0) +
                                                                            1,
                                                                    }),
                                                                );
                                                            }}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex items-center justify-between border-t pt-2">
                                                <div className="text-sm text-muted-foreground">
                                                    Calculated total
                                                </div>
                                                <div className="text-lg font-medium">
                                                    €
                                                    {computeBreakdownTotal(
                                                        saleEditBreakdown,
                                                    ).toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button
                                                    onClick={() => {
                                                        if (
                                                            !lastShift ||
                                                            !editingSale
                                                        )
                                                            return;
                                                        const computed =
                                                            computeBreakdownTotal(
                                                                saleEditBreakdown,
                                                            );
                                                        const amountToUse =
                                                            computed > 0
                                                                ? Number(
                                                                      computed.toFixed(
                                                                          2,
                                                                      ),
                                                                  )
                                                                : Number(
                                                                      editingSale.amount ||
                                                                          0,
                                                                  );

                                                        // optimistic UI update by refetching or updating local if needed
                                                        router.post(
                                                            `/office/${lastShift.id}/update-sale`,
                                                            {
                                                                sale_id:
                                                                    editingSale.id,
                                                                amount: amountToUse,
                                                                breakdown:
                                                                    saleEditBreakdown,
                                                            },
                                                            {
                                                                onSuccess:
                                                                    () => {
                                                                        setMessage(
                                                                            'Sale updated',
                                                                        );
                                                                        setIsSaleEditOpen(
                                                                            false,
                                                                        );
                                                                        // refresh overview to show updated numbers
                                                                        setTimeout(
                                                                            () =>
                                                                                router.get(
                                                                                    office()
                                                                                        .url,
                                                                                    {},
                                                                                    {
                                                                                        preserveState: true,
                                                                                        preserveScroll: true,
                                                                                    },
                                                                                ),
                                                                            200,
                                                                        );
                                                                    },
                                                                onError: () =>
                                                                    setMessage(
                                                                        'Failed to update sale',
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                {/* View-only cash breakdown for last shift */}
                                <Dialog
                                    open={isViewCashBreakdownOpen}
                                    onOpenChange={(v) => {
                                        setIsViewCashBreakdownOpen(v);
                                        setIsPollingPaused(v);
                                    }}
                                >
                                    <DialogContent>
                                        <DialogTitle>
                                            Cash distribution
                                        </DialogTitle>
                                        <DialogDescription>
                                            Read-only cash distribution for this
                                            shift.
                                        </DialogDescription>

                                        <div className="mt-4 grid grid-cols-1 gap-3">
                                            {[
                                                { key: '50', label: '€50' },
                                                { key: '20', label: '€20' },
                                                { key: '10', label: '€10' },
                                                { key: '5', label: '€5' },
                                                { key: '2', label: '€2' },
                                                { key: '1', label: '€1' },
                                                { key: '0_50', label: '50¢' },
                                                { key: '0_20', label: '20¢' },
                                                { key: '0_10', label: '10¢' },
                                                {
                                                    key: 'token',
                                                    label: 'Pink Token',
                                                },
                                            ].map((d) => (
                                                <div
                                                    key={d.key}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                            {d.label}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                        {Number(
                                                            (lastShift?.cash_breakdown ||
                                                                {})[d.key] ?? 0,
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex items-center justify-between border-t pt-2">
                                                <div className="text-sm text-muted-foreground">
                                                    Calculated total
                                                </div>
                                                <div className="text-lg font-medium">
                                                    €
                                                    {computeBreakdownTotal(
                                                        lastShift?.cash_breakdown ||
                                                            {},
                                                    ).toFixed(2)}
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Close
                                                    </Button>
                                                </DialogClose>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                </div>

                {/* Historical shifts list (older than lastShift) */}
                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">
                        All Office Shifts
                    </h3>

                    {filteredPastShifts && filteredPastShifts.length > 0 ? (
                        <div className="space-y-3">
                            {filteredPastShifts.map((s: any) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between rounded-md bg-muted/40 p-3"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {formatTimestamp(s.started_at)} —{' '}
                                            {formatTimestamp(s.ended_at)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {Array.isArray(s.workers) &&
                                            s.workers.length > 0
                                                ? s.workers
                                                      .map((w: any) => w.name)
                                                      .slice(0, 3)
                                                      .join(', ')
                                                : 'No workers'}
                                            {Array.isArray(s.workers) &&
                                            s.workers.length > 3
                                                ? ` +${s.workers.length - 3} more`
                                                : ''}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">
                                            €
                                            {(
                                                Number(s.total_cash ?? 0) +
                                                Number(s.total_card ?? 0)
                                            ).toFixed(2)}
                                        </div>

                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleEditClick(s)}
                                        >
                                            <Pencil className="mr-1 h-3 w-3" />
                                            Edit Cash
                                        </Button>

                                        <Link href={`/office/${s.id}`}>
                                            <Button size="sm" variant="ghost">
                                                Review
                                            </Button>
                                        </Link>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:bg-muted/30"
                                                >
                                                    Remove
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>
                                                    Delete this office shift?
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Deleting a shift will
                                                    permanently remove its sales
                                                    and worker history. This
                                                    action cannot be undone. Are
                                                    you sure?
                                                </DialogDescription>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => {
                                                                router.post(
                                                                    `/office/${s.id}/delete`,
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                        onStart:
                                                                            () => {},
                                                                        onSuccess:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Shift deleted',
                                                                                );
                                                                                setTimeout(
                                                                                    () =>
                                                                                        router.get(
                                                                                            office()
                                                                                                .url,
                                                                                            {},
                                                                                            {
                                                                                                preserveScroll: true,
                                                                                                preserveState: true,
                                                                                                replace: true,
                                                                                            },
                                                                                        ),
                                                                                    500,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () =>
                                                                                setMessage(
                                                                                    'Failed to delete shift',
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No office shifts available
                        </div>
                    )}
                </div>

                {/* Edit Cash Breakdown Modal */}
                <Dialog open={isEditCashBreakdownOpen} onOpenChange={setIsEditCashBreakdownOpen}>
                    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Cash Distribution</DialogTitle>
                            <DialogDescription>
                                Update the cash breakdown for this shift. The total will be calculated automatically.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {denominations.map((key: string) => (
                                <div key={key} className="flex items-center space-x-2">
                                    <label className="w-16 text-right text-sm font-medium">
                                        {formatLabel(key)}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={breakdownForm[key] || ''}
                                        onChange={(e) => handleBreakdownInputChange(key, e.target.value)}
                                        className="h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="text-sm font-medium">Calculated Total:</div>
                            <div className="text-lg font-semibold">
                                €{computeBreakdownTotal(breakdownForm).toFixed(2)}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditCashBreakdownOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleBreakdownSave}>
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
