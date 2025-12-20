import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { office } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check, Pencil } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office Shifts',
        href: office().url,
    },
];

// We'll rely on server-provided staff and activeShift.sales/workers — no client-side sample data

export default function Office() {
    const props = usePage<SharedData>().props;
    // server props are available via `props`; destructuring removed to avoid unused-variable lint failures

    // Build staff list from server props and mark those on shift.
    // products list is available on props when needed; avoid creating unused local var
    const sellables: any[] = Array.isArray(props['sellables'])
        ? props['sellables']
        : [];
    const activeShift: any = props['activeShift'] ?? null;
    const previousTotals: any = props['previousTotals'] ?? {
        cash: 0,
        card: 0,
        combined: 0,
    };

    // Filter sellables so event items are only visible when current date is within their sell window
    const isEventInSellWindow = (item: any) => {
        if (!item) return false;
        if (item.type !== 'event') return true; // products remain visible
        if (!item.start_sell_date || !item.end_sell_date) return false;
        const now = new Date();
        const start = new Date(item.start_sell_date);
        const end = new Date(item.end_sell_date);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
        return (
            now.getTime() >= start.getTime() && now.getTime() <= end.getTime()
        );
    };

    const filteredSellables = sellables.filter((s) => isEventInSellWindow(s));

    const [workers, setWorkers] = React.useState<any[]>([]);
    const [sales, setSales] = React.useState<any[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [isPollingPaused, setIsPollingPaused] = React.useState(false);

    // auto-dismiss messages
    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    React.useEffect(() => {
        const active: any = props['activeShift'] ?? null;
        setWorkers(Array.isArray(active?.workers) ? active.workers : []);
        setSales(Array.isArray(active?.sales) ? active.sales : []);
    }, [props['activeShift']]);



    // Poll active shift data (workers, sales, totals) every 2s so UI stays in sync
    React.useEffect(() => {
        if (!activeShift || isPollingPaused) return undefined;

        const interval = setInterval(() => {
            // Partial Inertia visit to refresh only the props we care about.
            // preserveState prevents losing any local UI state while updating props.
            // preserveScroll keeps the user's scroll position intact during polling.
            router.get(
                `/office/${activeShift.id}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [
                        'activeShift',
                        'previousTotals',
                        'staff',
                        'products',
                    ],
                },
            );
        }, 2000);

        return () => clearInterval(interval);
    }, [activeShift?.id, isPollingPaused]);

    // staff list annotated with whether they are currently on shift
    const staffData = (Array.isArray(props['staff']) ? props['staff'] : []).map(
        (m: any) => ({
            id: m.id,
            name: String(m.name || ''),
            role: String(m.role ?? ''),
            email: String(m.email ?? ''),
            onShift: Boolean((workers || []).find((w: any) => w.id === m.id)),
        }),
    );

    // sort so workers appear first
    staffData.sort((a: any, b: any) => {
        if (a.onShift === b.onShift) return a.name.localeCompare(b.name);
        return a.onShift ? -1 : 1;
    });

    // Quick-add Sale form state
    const [saleProductId, setSaleProductId] = React.useState<number | null>(
        filteredSellables.length ? filteredSellables[0].actual_id : null,
    );
    const [saleItemType, setSaleItemType] = React.useState<'product' | 'event'>(
        filteredSellables.length ? filteredSellables[0].type : 'product',
    );
    const [saleTicketType, setSaleTicketType] = React.useState<
        'with_card' | 'without_card'
    >('with_card');

    // When sellables change (filtered list changes), update defaults to first available
    React.useEffect(() => {
        if (filteredSellables.length) {
            setSaleProductId(filteredSellables[0].actual_id ?? null);
            setSaleItemType(filteredSellables[0].type ?? 'product');
        } else {
            setSaleProductId(null);
            setSaleItemType('product');
        }
    }, [filteredSellables.length]);

    // Custom sale form state (separate from quick-add)
    const [customSaleItemId, setCustomSaleItemId] =
        React.useState<string>('custom');
    const [customAmount, setCustomAmount] = React.useState('');
    const [customDescription, setCustomDescription] = React.useState('');

    const cashTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'cash')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const cardTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'card')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const combinedTotal = cashTotal + cardTotal;

    // Revenue editable states
    // start totals are editable client-side (with pencil icon), last totals are not
    const [startTotals, setStartTotals] = React.useState<{
        cash: number;
        card: number;
    }>({
        cash: Number(activeShift?.start_cash ?? 0),
        card: Number(activeShift?.start_card ?? 0),
    });
    // editing state for start of shift
    const [editingStart, setEditingStart] = React.useState<{
        cash: boolean;
        card: boolean;
    }>({ cash: false, card: false });
    const [pendingStart, setPendingStart] = React.useState<{
        cash: number;
        card: number;
    } | null>(null);
    const [lastTotals] = React.useState<{ cash: number; card: number }>({
        cash: Number(previousTotals?.cash ?? 0),
        card: Number(previousTotals?.card ?? 0),
    });

    // collapsible UI state for start/last sections
    const [startCollapsed, setStartCollapsed] = React.useState<boolean>(false);
    const [lastCollapsed, setLastCollapsed] = React.useState<boolean>(false);
    const [activeCollapsed, setActiveCollapsed] =
        React.useState<boolean>(false);
    const [totalCollapsed, setTotalCollapsed] = React.useState<boolean>(false);

    // Track revenue section height
    const revenueRef = React.useRef<HTMLDivElement>(null);
    const [revenueHeight, setRevenueHeight] = React.useState<number | null>(
        null,
    );

    // Update revenue height whenever content changes
    React.useEffect(() => {
        if (!revenueRef.current) return;

        const updateHeight = () => {
            if (revenueRef.current) {
                // Force a reflow to ensure accurate measurement
                const height =
                    revenueRef.current.getBoundingClientRect().height;
                setRevenueHeight(height);
            }
        };

        // Initial measurement with slight delay to ensure DOM is ready
        const initialTimer = setTimeout(updateHeight, 0);

        // Use ResizeObserver to track height changes
        const resizeObserver = new ResizeObserver(() => {
            // Debounce the height update slightly to avoid rapid consecutive updates
            requestAnimationFrame(updateHeight);
        });
        resizeObserver.observe(revenueRef.current);

        return () => {
            clearTimeout(initialTimer);
            resizeObserver.disconnect();
        };
    }, [
        startCollapsed,
        lastCollapsed,
        activeCollapsed,
        totalCollapsed,
        editingStart.cash,
        editingStart.card,
        pendingStart,
        sales,
        workers,
    ]);

    // Sync start totals from polled activeShift data (unless user is editing)
    React.useEffect(() => {
        if (activeShift && !editingStart.cash && !editingStart.card) {
            setStartTotals({
                cash: Number(activeShift.start_cash ?? 0),
                card: Number(activeShift.start_card ?? 0),
            });
        }
    }, [
        activeShift?.start_cash,
        activeShift?.start_card,
        editingStart.cash,
        editingStart.card,
    ]);

    // Cash breakdown modal state
    const [isCashModalOpen, setIsCashModalOpen] = React.useState(false);
    const [cashBreakdown, setCashBreakdown] = React.useState<
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

    // Custom-sale cash breakdown modal state
    const [isCustomCashModalOpen, setIsCustomCashModalOpen] =
        React.useState(false);
    const [customCashBreakdown, setCustomCashBreakdown] = React.useState<
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
    // If a quick-add sale opened the modal, store its context here so Save can record the correct sale
    const [quickSaleContext, setQuickSaleContext] = React.useState<any | null>(
        null,
    );

    const openCashModalForStart = () => {
        // initialize from activeShift if present
        const existing =
            activeShift &&
            (activeShift.start_cash_breakdown ||
                activeShift.start_cash_breakdown === null)
                ? activeShift.start_cash_breakdown
                : (activeShift?.start_cash_breakdown ?? null);
        const init: Record<string, number> = {
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
        };
        if (existing && typeof existing === 'object') {
            for (const k of Object.keys(init)) {
                init[k] = Number(existing[k] ?? 0);
            }
        }
        setCashBreakdown(init);
        setIsCashModalOpen(true);
    };

    const computeBreakdownTotal = (b: Record<string, number>) => {
        const values: Record<string, number> = {
            '50': 50,
            '20': 20,
            '10': 10,
            '5': 5,
            '2': 2,
            '1': 1,
            '0_50': 0.5,
            '0_20': 0.2,
            '0_10': 0.1,
            token: 0,
        };
        let t = 0;
        for (const k of Object.keys(values)) {
            t += (Number(b[k] ?? 0) || 0) * values[k];
        }
        return t;
    };

    const openCustomCashModal = (context: any | null = null) => {
        // initialize from activeShift current cash breakdown if present
        const existing =
            activeShift &&
            (activeShift.cash_breakdown || activeShift.cash_breakdown === null)
                ? activeShift.cash_breakdown
                : (activeShift?.cash_breakdown ?? null);
        const init: Record<string, number> = {
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
        };
        if (existing && typeof existing === 'object') {
            for (const k of Object.keys(init)) {
                init[k] = Number(existing[k] ?? 0);
            }
        }
        setCustomCashBreakdown(init);
        setQuickSaleContext(context);
        setIsCustomCashModalOpen(true);
    };

    // Sale edit modal (for editing individual cash transactions)
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
    // view-only cash breakdown modal for this shift
    const [isViewCashBreakdownOpen, setIsViewCashBreakdownOpen] =
        React.useState(false);

    const openSaleEditModal = (sale: any) => {
        setEditingSale(sale);

        // Try to initialize the breakdown from any existing breakdown on the sale.
        // Fallbacks checked (in order): sale.cash_breakdown, sale.breakdown, sale.snapshot?.cash_breakdown
        const existing =
            sale && typeof sale === 'object'
                ? (sale.cash_breakdown ??
                  sale.breakdown ??
                  (sale.snapshot && sale.snapshot.cash_breakdown) ??
                  null)
                : null;

        const zeroInit: Record<string, number> = {
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
        };

        if (existing && typeof existing === 'object') {
            const init: Record<string, number> = { ...zeroInit };
            for (const k of Object.keys(init)) {
                init[k] = Number(existing[k] ?? 0);
            }
            setSaleEditBreakdown(init);
            setIsSaleEditOpen(true);
            return;
        }

        // If no explicit breakdown exists, derive a greedy breakdown from the sale amount so the modal shows a sensible starting point
        const amt = Number(sale?.amount ?? 0) || 0;
        const denominations: Array<{ key: string; value: number }> = [
            { key: '50', value: 50 },
            { key: '20', value: 20 },
            { key: '10', value: 10 },
            { key: '5', value: 5 },
            { key: '2', value: 2 },
            { key: '1', value: 1 },
            { key: '0_50', value: 0.5 },
            { key: '0_20', value: 0.2 },
            { key: '0_10', value: 0.1 },
            // tokens have no monetary value by default
            { key: 'token', value: 0 },
        ];

        let remaining = Math.round(amt * 100) / 100; // avoid floating noise
        const derived: Record<string, number> = { ...zeroInit };
        for (const d of denominations) {
            if (d.value === 0) {
                derived[d.key] = 0;
                continue;
            }
            const count = Math.floor(remaining / d.value);
            if (count > 0) {
                derived[d.key] = count;
                remaining =
                    Math.round((remaining - count * d.value) * 100) / 100;
            }
        }

        setSaleEditBreakdown(derived);
        setIsSaleEditOpen(true);
    };

    // totals including start-of-shift amounts (start + live)
    const totalCash = Number(startTotals.cash ?? 0) + cashTotal;
    const totalCard = Number(startTotals.card ?? 0) + cardTotal;
    const totalCombined = totalCash + totalCard;

    // Helpers to format shift date/title and start time
    const dayOrdinal = (n: number) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return `${n}th`;
        switch (n % 10) {
            case 1:
                return `${n}st`;
            case 2:
                return `${n}nd`;
            case 3:
                return `${n}rd`;
            default:
                return `${n}th`;
        }
    };

    const formatShiftTitle = (iso?: string | null) => {
        if (!iso) return 'Shift actions';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'Shift actions';
        const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
        const month = d.toLocaleDateString(undefined, { month: 'long' });
        const day = dayOrdinal(d.getDate());
        return `${weekday}, ${month} ${day}`;
    };

    const formatStartTime = (iso?: string | null) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Summarize sales by base name (strip ticket variation like "(with ESN card)") and show events first
    const summarizeSales = (sales?: any[]) => {
        if (!Array.isArray(sales) || sales.length === 0) return '';

        const normalizeName = (sale: any) => {
            const raw = String(sale?.name ?? 'Unknown').trim();
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office Shifts" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert>
                            <Check />
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                {/* Top row: three summary cards */}
                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                    {/* Workers */}
                    <section
                        className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                        style={{
                            height: revenueHeight
                                ? `${revenueHeight}px`
                                : 'auto',
                            minHeight: revenueHeight
                                ? `${revenueHeight}px`
                                : 'auto',
                        }}
                    >
                        <h3 className="text-sm font-semibold">Workers</h3>
                        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                            <ul className="space-y-2">
                                {staffData.map((member: any) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">
                                                {member.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {member.role}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!member.onShift ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        !activeShift ||
                                                        submitting
                                                    }
                                                    onClick={() => {
                                                        if (!activeShift)
                                                            return;
                                                        const newWorker = {
                                                            id: member.id,
                                                            name: member.name,
                                                            role: member.role,
                                                            email: member.email,
                                                        };
                                                        setWorkers((prev) => {
                                                            const filtered = (
                                                                prev || []
                                                            ).filter(
                                                                (w: any) =>
                                                                    w.id !==
                                                                    newWorker.id,
                                                            );
                                                            return [
                                                                newWorker,
                                                                ...filtered,
                                                            ];
                                                        });

                                                        router.post(
                                                            `/office/${activeShift.id}/add-worker`,
                                                            {
                                                                user_id:
                                                                    member.id,
                                                            },
                                                            {
                                                                onStart: () =>
                                                                    setSubmitting(
                                                                        true,
                                                                    ),
                                                                onFinish: () =>
                                                                    setSubmitting(
                                                                        false,
                                                                    ),
                                                                onSuccess: () =>
                                                                    setMessage(
                                                                        'Worker added',
                                                                    ),
                                                                onError: () => {
                                                                    setWorkers(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            (
                                                                                prev ||
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    w: any,
                                                                                ) =>
                                                                                    w.id !==
                                                                                    member.id,
                                                                            ),
                                                                    );
                                                                    setMessage(
                                                                        'Failed to add worker',
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:bg-muted/30"
                                                        disabled={submitting}
                                                        onClick={() => {
                                                            if (!activeShift)
                                                                return;
                                                            const wid =
                                                                member.id;
                                                            setWorkers((prev) =>
                                                                (
                                                                    prev || []
                                                                ).filter(
                                                                    (w: any) =>
                                                                        w.id !==
                                                                        wid,
                                                                ),
                                                            );

                                                            router.post(
                                                                `/office/${activeShift.id}/remove-worker`,
                                                                {
                                                                    user_id:
                                                                        wid,
                                                                },
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () =>
                                                                            setMessage(
                                                                                'Worker removed',
                                                                            ),
                                                                    onError:
                                                                        () => {
                                                                            setWorkers(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const wasPresent =
                                                                                        (
                                                                                            prev ||
                                                                                            []
                                                                                        ).some(
                                                                                            (
                                                                                                w: any,
                                                                                            ) =>
                                                                                                w.id ===
                                                                                                wid,
                                                                                        );
                                                                                    if (
                                                                                        wasPresent
                                                                                    )
                                                                                        return prev;
                                                                                    return [
                                                                                        {
                                                                                            id: member.id,
                                                                                            name: member.name,
                                                                                            role: member.role,
                                                                                            email: member.email,
                                                                                        },
                                                                                        ...(prev ||
                                                                                            []),
                                                                                    ];
                                                                                },
                                                                            );
                                                                            setMessage(
                                                                                'Failed to remove worker',
                                                                            );
                                                                        },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>

                                                    <div className="text-sm text-neutral-600">
                                                        On shift
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Revenue */}
                    <section
                        ref={revenueRef}
                        className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                    >
                        <h3 className="text-sm font-semibold">Revenue</h3>
                        <div className="mt-4 space-y-3">
                            {/* Start of shift (editable) */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Start of shift
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setStartCollapsed((s) => !s)
                                        }
                                    >
                                        {startCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>
                                {/* Custom sale cash breakdown modal */}
                                <Dialog
                                    open={isCustomCashModalOpen}
                                    onOpenChange={(v) => {
                                        setIsCustomCashModalOpen(v);
                                        if (!v) setQuickSaleContext(null);
                                        setIsPollingPaused(v);
                                    }}
                                >
                                    <DialogContent>
                                        <DialogTitle>
                                            Cash breakdown for Custom Sale
                                        </DialogTitle>
                                        <DialogDescription>
                                            Provide the counts of bills, coins
                                            and tokens for this cash sale. The
                                            calculated total will be used as the
                                            sale amount.
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
                                                                setCustomCashBreakdown(
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
                                                                customCashBreakdown[
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
                                                                setCustomCashBreakdown(
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
                                                                setCustomCashBreakdown(
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
                                                        customCashBreakdown,
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
                                                        if (!activeShift)
                                                            return;
                                                        setSubmitting(true);

                                                        const computed = Number(
                                                            computeBreakdownTotal(
                                                                customCashBreakdown,
                                                            ).toFixed(2),
                                                        );

                                                        // Determine if this modal was opened for a quick-add sale
                                                        const isQuick =
                                                            Boolean(
                                                                quickSaleContext,
                                                            );

                                                        let amountToUse: number = 0;
                                                        let selectedItem: any =
                                                            null;
                                                        let itemName =
                                                            'Custom Sale';
                                                        let productIdToSend: any =
                                                            null;
                                                        let itemTypeToSend: any =
                                                            'custom';
                                                        let descToUse = String(
                                                            customDescription ||
                                                                '',
                                                        );
                                                        let ticketTypeToSend: any =
                                                            undefined;
                                                        let ticketLabelToSend: any =
                                                            undefined;

                                                        if (isQuick) {
                                                            // Quick-add context: use the referenced sellable to determine fallback amount
                                                            selectedItem =
                                                                filteredSellables.find(
                                                                    (i: any) =>
                                                                        i.actual_id ===
                                                                        quickSaleContext.productId,
                                                                );
                                                            productIdToSend =
                                                                quickSaleContext.productId;
                                                            itemTypeToSend =
                                                                quickSaleContext.itemType;
                                                            ticketTypeToSend =
                                                                quickSaleContext.ticketType;
                                                            ticketLabelToSend =
                                                                quickSaleContext.ticketLabel;
                                                            if (computed > 0) {
                                                                amountToUse =
                                                                    computed;
                                                            } else if (
                                                                selectedItem
                                                            ) {
                                                                if (
                                                                    selectedItem.type ===
                                                                    'product'
                                                                ) {
                                                                    amountToUse =
                                                                        Number(
                                                                            selectedItem.price ||
                                                                                0,
                                                                        );
                                                                } else {
                                                                    amountToUse =
                                                                        Number(
                                                                            quickSaleContext.ticketType ===
                                                                                'with_card'
                                                                                ? selectedItem.price_with_card
                                                                                : selectedItem.price_without_card,
                                                                        ) || 0;
                                                                }
                                                            } else {
                                                                amountToUse = 0;
                                                            }
                                                            itemName =
                                                                selectedItem
                                                                    ? selectedItem.name
                                                                    : 'Quick Sale';
                                                            // quick adds have no description
                                                            descToUse = '';
                                                        } else {
                                                            // Custom sale flow
                                                            const computedAmount =
                                                                computed > 0
                                                                    ? computed
                                                                    : Number(
                                                                          customAmount ||
                                                                              0,
                                                                      );
                                                            amountToUse =
                                                                computedAmount;
                                                            const isCustom =
                                                                customSaleItemId ===
                                                                'custom';
                                                            selectedItem =
                                                                isCustom
                                                                    ? null
                                                                    : filteredSellables.find(
                                                                          (
                                                                              i: any,
                                                                          ) =>
                                                                              i.id ===
                                                                              customSaleItemId,
                                                                      );
                                                            productIdToSend =
                                                                selectedItem
                                                                    ? selectedItem.actual_id
                                                                    : null;
                                                            itemTypeToSend =
                                                                selectedItem
                                                                    ? selectedItem.type
                                                                    : 'custom';
                                                            itemName =
                                                                selectedItem
                                                                    ? selectedItem.name
                                                                    : 'Custom Sale';
                                                        }

                                                        const tempId = `tmp-${Date.now()}`;
                                                        const tempSale: any = {
                                                            id: tempId,
                                                            name: itemName,
                                                            method: 'Cash',
                                                            amount: Number(
                                                                amountToUse,
                                                            ),
                                                            description:
                                                                descToUse,
                                                        };
                                                        setSales((prev) => [
                                                            tempSale,
                                                            ...(prev || []),
                                                        ]);

                                                        // First update the cash breakdown for current cashbox
                                                        router.post(
                                                            `/office/${activeShift.id}/update-cash-breakdown`,
                                                            {
                                                                target: 'current',
                                                                breakdown:
                                                                    customCashBreakdown,
                                                            },
                                                            {
                                                                onSuccess:
                                                                    () => {
                                                                        // After breakdown persisted, record the sale
                                                                        router.post(
                                                                            `/office/${activeShift?.id}/record-sale`,
                                                                            {
                                                                                product_id:
                                                                                    productIdToSend,
                                                                                item_type:
                                                                                    itemTypeToSend,
                                                                                method: 'Cash',
                                                                                amount: String(
                                                                                    amountToUse,
                                                                                ),
                                                                                description:
                                                                                    descToUse,
                                                                                ticket_type:
                                                                                    ticketTypeToSend,
                                                                                ticket_label:
                                                                                    ticketLabelToSend,
                                                                            },
                                                                            {
                                                                                onSuccess:
                                                                                    () => {
                                                                                        setMessage(
                                                                                            isQuick
                                                                                                ? 'Sale recorded (Cash)'
                                                                                                : 'Custom sale recorded (Cash)',
                                                                                        );
                                                                                        if (
                                                                                            !isQuick
                                                                                        ) {
                                                                                            setCustomSaleItemId(
                                                                                                'custom',
                                                                                            );
                                                                                            setCustomAmount(
                                                                                                '',
                                                                                            );
                                                                                            setCustomDescription(
                                                                                                '',
                                                                                            );
                                                                                        }
                                                                                        setIsCustomCashModalOpen(
                                                                                            false,
                                                                                        );
                                                                                        setQuickSaleContext(
                                                                                            null,
                                                                                        );
                                                                                    },
                                                                                onError:
                                                                                    () => {
                                                                                        setSales(
                                                                                            (
                                                                                                prev,
                                                                                            ) =>
                                                                                                (
                                                                                                    prev ||
                                                                                                    []
                                                                                                ).filter(
                                                                                                    (
                                                                                                        s: any,
                                                                                                    ) =>
                                                                                                        s.id !==
                                                                                                        tempId,
                                                                                                ),
                                                                                        );
                                                                                        setMessage(
                                                                                            'Failed to record sale',
                                                                                        );
                                                                                    },
                                                                                onFinish:
                                                                                    () =>
                                                                                        setSubmitting(
                                                                                            false,
                                                                                        ),
                                                                            },
                                                                        );
                                                                    },
                                                                onError: () => {
                                                                    setSubmitting(
                                                                        false,
                                                                    );
                                                                    setSales(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            (
                                                                                prev ||
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    s: any,
                                                                                ) =>
                                                                                    s.id !==
                                                                                    tempId,
                                                                            ),
                                                                    );
                                                                    setMessage(
                                                                        'Failed to save cash breakdown',
                                                                    );
                                                                },
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

                                {!startCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingStart.cash ? (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32"
                                                            value={String(
                                                                pendingStart?.cash ??
                                                                    startTotals.cash,
                                                            )}
                                                            onChange={(e) =>
                                                                setPendingStart(
                                                                    (prev) => ({
                                                                        ...(prev ??
                                                                            startTotals),
                                                                        cash: Number(
                                                                            e
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (
                                                                    !activeShift
                                                                )
                                                                    return;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                const newCash =
                                                                    pendingStart?.cash ??
                                                                    startTotals.cash;
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: newCash,
                                                                        card: startTotals.card,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setStartTotals(
                                                                                    (
                                                                                        s,
                                                                                    ) => ({
                                                                                        ...s,
                                                                                        cash: newCash,
                                                                                    }),
                                                                                );
                                                                                setMessage(
                                                                                    'Start cash updated',
                                                                                );
                                                                                setEditingStart(
                                                                                    (
                                                                                        e,
                                                                                    ) => ({
                                                                                        ...e,
                                                                                        cash: false,
                                                                                    }),
                                                                                );
                                                                                setPendingStart(
                                                                                    null,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start cash',
                                                                                );
                                                                            },
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        cash: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-lg font-medium">
                                                            €
                                                            {Number(
                                                                startTotals.cash,
                                                            ).toFixed(2)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                openCashModalForStart()
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingStart.card ? (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32"
                                                            value={String(
                                                                pendingStart?.card ??
                                                                    startTotals.card,
                                                            )}
                                                            onChange={(e) =>
                                                                setPendingStart(
                                                                    (prev) => ({
                                                                        ...(prev ??
                                                                            startTotals),
                                                                        card: Number(
                                                                            e
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (
                                                                    !activeShift
                                                                )
                                                                    return;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                const newCard =
                                                                    pendingStart?.card ??
                                                                    startTotals.card;
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: startTotals.cash,
                                                                        card: newCard,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setStartTotals(
                                                                                    (
                                                                                        s,
                                                                                    ) => ({
                                                                                        ...s,
                                                                                        card: newCard,
                                                                                    }),
                                                                                );
                                                                                setMessage(
                                                                                    'Start card updated',
                                                                                );
                                                                                setEditingStart(
                                                                                    (
                                                                                        e,
                                                                                    ) => ({
                                                                                        ...e,
                                                                                        card: false,
                                                                                    }),
                                                                                );
                                                                                setPendingStart(
                                                                                    null,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start card',
                                                                                );
                                                                            },
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        card: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-lg font-medium">
                                                            €
                                                            {Number(
                                                                startTotals.card,
                                                            ).toFixed(2)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        card: true,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cash breakdown modal trigger (replace inline cash editor) */}
                                        <Dialog
                                            open={isCashModalOpen}
                                            onOpenChange={(v) => {
                                                setIsCashModalOpen(v);
                                                setIsPollingPaused(v);
                                            }}
                                        >
                                            <DialogContent>
                                                <DialogTitle>
                                                    Cash breakdown
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Enter counts for each
                                                    denomination to calculate
                                                    the total cash in the
                                                    cashbox.
                                                </DialogDescription>

                                                <div className="mt-4 grid grid-cols-1 gap-3">
                                                    {/* Render denominations in required order */}
                                                    {[
                                                        {
                                                            key: '50',
                                                            label: '€50',
                                                        },
                                                        {
                                                            key: '20',
                                                            label: '€20',
                                                        },
                                                        {
                                                            key: '10',
                                                            label: '€10',
                                                        },
                                                        {
                                                            key: '5',
                                                            label: '€5',
                                                        },
                                                        {
                                                            key: '2',
                                                            label: '€2',
                                                        },
                                                        {
                                                            key: '1',
                                                            label: '€1',
                                                        },
                                                        {
                                                            key: '0_50',
                                                            label: '50¢',
                                                        },
                                                        {
                                                            key: '0_20',
                                                            label: '20¢',
                                                        },
                                                        {
                                                            key: '0_10',
                                                            label: '10¢',
                                                        },
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
                                                                <div className="text-sm text-muted-foreground">
                                                                    {d.label ===
                                                                    'Pink Token'
                                                                        ? 'jeton'
                                                                        : ''}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setCashBreakdown(
                                                                            (
                                                                                prev,
                                                                            ) => ({
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
                                                                        cashBreakdown[
                                                                            d
                                                                                .key
                                                                        ] ?? 0,
                                                                    )}
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const v =
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value ||
                                                                                    0,
                                                                            );
                                                                        setCashBreakdown(
                                                                            (
                                                                                prev,
                                                                            ) => ({
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
                                                                        setCashBreakdown(
                                                                            (
                                                                                prev,
                                                                            ) => ({
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
                                                                cashBreakdown,
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
                                                                    !activeShift
                                                                )
                                                                    return;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-cash-breakdown`,
                                                                    {
                                                                        target: 'start',
                                                                        breakdown:
                                                                            cashBreakdown,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setStartTotals(
                                                                                    (
                                                                                        s,
                                                                                    ) => ({
                                                                                        ...s,
                                                                                        cash: Number(
                                                                                            computeBreakdownTotal(
                                                                                                cashBreakdown,
                                                                                            ).toFixed(
                                                                                                2,
                                                                                            ),
                                                                                        ),
                                                                                    }),
                                                                                );
                                                                                setMessage(
                                                                                    'Start cash breakdown saved',
                                                                                );
                                                                                setIsCashModalOpen(
                                                                                    false,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () =>
                                                                                setMessage(
                                                                                    'Failed to save breakdown',
                                                                                ),
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
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

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-lg font-semibold">
                                                €
                                                {(
                                                    Number(startTotals.cash) +
                                                    Number(startTotals.card)
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t" />

                            {/* Last office shift (editable) */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Last office shift - safety check
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setLastCollapsed((s) => !s)
                                        }
                                    >
                                        {lastCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!lastCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €
                                                {Number(
                                                    lastTotals.cash,
                                                ).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €
                                                {Number(
                                                    lastTotals.card,
                                                ).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-lg font-semibold">
                                                €
                                                {(
                                                    Number(lastTotals.cash) +
                                                    Number(lastTotals.card)
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Active office shift
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setActiveCollapsed((s) => !s)
                                        }
                                    >
                                        {activeCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!activeCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Live Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{cashTotal.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Live Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{cardTotal.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-xl font-semibold">
                                                €{combinedTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Total money (start + live)
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setTotalCollapsed((s) => !s)
                                        }
                                    >
                                        {totalCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!totalCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{totalCash.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{totalCard.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-xl font-semibold">
                                                €{totalCombined.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Shift actions */}
                    <section
                        className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                        style={{
                            height: revenueHeight
                                ? `${revenueHeight}px`
                                : 'auto',
                            minHeight: revenueHeight
                                ? `${revenueHeight}px`
                                : 'auto',
                        }}
                    >
                        <h3 className="text-sm font-semibold">
                            {formatShiftTitle(activeShift?.started_at)}
                        </h3>
                        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                            {activeShift && (
                                <div className="text-xs text-muted-foreground">
                                    Started by:{' '}
                                    {activeShift.started_by_email ?? 'Unknown'}
                                    {activeShift.started_at
                                        ? ` at ${formatStartTime(activeShift.started_at)}`
                                        : ''}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    disabled={Boolean(activeShift)}
                                    onClick={() => {
                                        router.post(
                                            '/office/start',
                                            {},
                                            {
                                                onStart: () =>
                                                    setSubmitting(true),
                                                onFinish: () =>
                                                    setSubmitting(false),
                                                onSuccess: () => {
                                                    setMessage('Shift started');
                                                    setTimeout(
                                                        () => router.reload(),
                                                        600,
                                                    );
                                                },
                                                onError: () =>
                                                    setMessage(
                                                        'Failed to start shift',
                                                    ),
                                            },
                                        );
                                    }}
                                >
                                    Start shift
                                </Button>

                                {activeShift?.status === 'open' ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                End shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                End this office shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Ending the shift will mark it as
                                                closed. This action can be
                                                reversed by reopening the shift,
                                                but historical context may
                                                change. Are you sure you want to
                                                end the shift?
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
                                                            if (!activeShift)
                                                                return;
                                                            router.post(
                                                                `/office/${activeShift?.id}/end`,
                                                                {},
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () => {
                                                                            setMessage(
                                                                                'Shift ended',
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    router.reload(),
                                                                                600,
                                                                            );
                                                                        },
                                                                    onError:
                                                                        () =>
                                                                            setMessage(
                                                                                'Failed to end shift',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        End shift
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Reopen shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Reopen this office shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Reopening the shift will set its
                                                status back to open and clear
                                                the end time. Confirm if you
                                                want to continue.
                                            </DialogDescription>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>

                                                <DialogClose asChild>
                                                    <Button
                                                        onClick={() => {
                                                            if (!activeShift)
                                                                return;
                                                            router.post(
                                                                `/office/${activeShift?.id}/reopen`,
                                                                {},
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () => {
                                                                            setMessage(
                                                                                'Shift reopened',
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    router.reload(),
                                                                                600,
                                                                            );
                                                                        },
                                                                    onError:
                                                                        () =>
                                                                            setMessage(
                                                                                'Failed to reopen shift',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Reopen shift
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>

                            {/* Quick add sale */}
                            <div className="mt-2 border-t pt-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium">
                                        Quick add sale
                                    </h4>
                                    <Link href="/sellables">
                                        <Button size="sm" variant="ghost">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select
                                        value={String(saleProductId ?? '')}
                                        onChange={(e) => {
                                            const id =
                                                Number(e.target.value) || null;
                                            setSaleProductId(id);
                                            const item = filteredSellables.find(
                                                (i: any) => i.actual_id === id,
                                            );
                                            if (item) {
                                                setSaleItemType(item.type);
                                            }
                                        }}
                                        className="w-full rounded-md border p-2"
                                    >
                                        {filteredSellables.map((item: any) => {
                                            const label =
                                                item.type === 'product'
                                                    ? `${item.name} — €${Number(item.price).toFixed(2)}`
                                                    : `${item.name} — Event`;
                                            return (
                                                <option
                                                    key={item.id}
                                                    value={item.actual_id}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Show ticket type selection for events */}
                                {saleItemType === 'event' &&
                                    (() => {
                                        const selectedItem =
                                            filteredSellables.find(
                                                (i: any) =>
                                                    i.actual_id ===
                                                    saleProductId,
                                            );
                                        return selectedItem ? (
                                            <div className="mt-2 space-y-2">
                                                <label className="flex cursor-pointer items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="ticket-type"
                                                        value="with_card"
                                                        checked={
                                                            saleTicketType ===
                                                            'with_card'
                                                        }
                                                        onChange={() =>
                                                            setSaleTicketType(
                                                                'with_card',
                                                            )
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-sm">
                                                        With ESN Card — €
                                                        {Number(
                                                            selectedItem.price_with_card,
                                                        ).toFixed(2)}
                                                    </span>
                                                </label>
                                                <label className="flex cursor-pointer items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="ticket-type"
                                                        value="without_card"
                                                        checked={
                                                            saleTicketType ===
                                                            'without_card'
                                                        }
                                                        onChange={() =>
                                                            setSaleTicketType(
                                                                'without_card',
                                                            )
                                                        }
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="text-sm">
                                                        Without ESN Card — €
                                                        {Number(
                                                            selectedItem.price_without_card,
                                                        ).toFixed(2)}
                                                    </span>
                                                </label>
                                            </div>
                                        ) : null;
                                    })()}

                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        onClick={() => {
                                            if (!saleProductId || !activeShift)
                                                return;
                                            const selectedItem =
                                                filteredSellables.find(
                                                    (i: any) =>
                                                        i.actual_id ===
                                                        saleProductId,
                                                );
                                            if (!selectedItem) return;

                                            // open cash breakdown modal with quick-sale context so Save records the sale
                                            openCustomCashModal({
                                                productId: saleProductId,
                                                itemType: selectedItem.type,
                                                ticketType: saleTicketType,
                                                ticketLabel:
                                                    selectedItem.type ===
                                                    'event'
                                                        ? saleTicketType ===
                                                          'with_card'
                                                            ? 'With ESN Card'
                                                            : 'Without ESN Card'
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        Add Cash
                                    </Button>

                                    <Button
                                        onClick={() => {
                                            if (!saleProductId || !activeShift)
                                                return;
                                            const selectedItem =
                                                filteredSellables.find(
                                                    (i: any) =>
                                                        i.actual_id ===
                                                        saleProductId,
                                                );
                                            if (!selectedItem) return;

                                            let amountToUse = '0';
                                            let itemName = selectedItem.name;

                                            if (
                                                selectedItem.type === 'product'
                                            ) {
                                                amountToUse = String(
                                                    selectedItem.price,
                                                );
                                            } else {
                                                amountToUse =
                                                    saleTicketType ===
                                                    'with_card'
                                                        ? String(
                                                              selectedItem.price_with_card,
                                                          )
                                                        : String(
                                                              selectedItem.price_without_card,
                                                          );
                                                itemName += ` (${saleTicketType === 'with_card' ? 'with' : 'without'} ESN card)`;
                                            }

                                            const ticketLabel =
                                                selectedItem.type === 'event'
                                                    ? saleTicketType ===
                                                      'with_card'
                                                        ? 'With ESN Card'
                                                        : 'Without ESN Card'
                                                    : '';

                                            const tempId = `tmp-${Date.now()}`;
                                            const tempSale: any = {
                                                id: tempId,
                                                name: itemName,
                                                method: 'Card',
                                                amount: Number(amountToUse),
                                                description: '',
                                                ticket_type:
                                                    selectedItem.type ===
                                                    'event'
                                                        ? saleTicketType
                                                        : undefined,
                                                ticket_label:
                                                    ticketLabel || undefined,
                                            };
                                            setSales((prev) => [
                                                tempSale,
                                                ...(prev || []),
                                            ]);
                                            setSubmitting(true);
                                            router.post(
                                                `/office/${activeShift?.id}/record-sale`,
                                                {
                                                    product_id: saleProductId,
                                                    item_type:
                                                        selectedItem.type,
                                                    method: 'Card',
                                                    amount: amountToUse,
                                                    ticket_type:
                                                        selectedItem.type ===
                                                        'event'
                                                            ? saleTicketType
                                                            : undefined,
                                                    ticket_label:
                                                        ticketLabel ||
                                                        undefined,
                                                },
                                                {
                                                    onSuccess: () =>
                                                        setMessage(
                                                            'Sale recorded (Card)',
                                                        ),
                                                    onError: () => {
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (s: any) =>
                                                                    s.id !==
                                                                    tempId,
                                                            ),
                                                        );
                                                        setMessage(
                                                            'Failed to record sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
                                                },
                                            );
                                        }}
                                    >
                                        Add Card
                                    </Button>

                                    <div className="flex-1" />
                                </div>
                            </div>

                            <div className="mt-2 border-t pt-2">
                                <h4 className="text-xs font-medium">
                                    Custom sale
                                </h4>

                                {/* Custom sale: only amount and description inputs are shown (product/method hidden but still sent) */}
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select
                                        value={customSaleItemId}
                                        onChange={(e) =>
                                            setCustomSaleItemId(e.target.value)
                                        }
                                        className="rounded-md border p-2"
                                    >
                                        <option value="custom">Custom</option>
                                        {filteredSellables.map((item: any) => {
                                            const label =
                                                item.type === 'product'
                                                    ? `${item.name} — €${Number(item.price).toFixed(2)}`
                                                    : `${item.name} — Event`;
                                            return (
                                                <option
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="€0.00"
                                            value={customAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow numeric values (including decimals)
                                                if (
                                                    value === '' ||
                                                    /^\d*\.?\d*$/.test(value)
                                                ) {
                                                    setCustomAmount(value);
                                                }
                                            }}
                                        />
                                    </div>

                                    <Input
                                        placeholder="Description (mandatory)"
                                        value={customDescription}
                                        onChange={(e) =>
                                            setCustomDescription(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        disabled={
                                            !activeShift || !customDescription
                                        }
                                        onClick={() => {
                                            // open the custom cash breakdown modal before saving
                                            if (
                                                !activeShift ||
                                                !customDescription
                                            )
                                                return;
                                            openCustomCashModal(null);
                                        }}
                                    >
                                        Add Cash
                                    </Button>

                                    <Button
                                        disabled={
                                            !activeShift ||
                                            !customAmount ||
                                            !customDescription
                                        }
                                        onClick={() => {
                                            if (
                                                !activeShift ||
                                                !customAmount ||
                                                !customDescription
                                            )
                                                return;

                                            const isCustom =
                                                customSaleItemId === 'custom';
                                            const selectedItem = isCustom
                                                ? null
                                                : filteredSellables.find(
                                                      (i: any) =>
                                                          i.id ===
                                                          customSaleItemId,
                                                  );

                                            const amountToUse =
                                                String(customAmount);
                                            const descToUse = String(
                                                customDescription || '',
                                            );
                                            const itemName = selectedItem
                                                ? selectedItem.name
                                                : 'Custom Sale';

                                            const tempId = `tmp-${Date.now()}`;
                                            const tempSale: any = {
                                                id: tempId,
                                                name: itemName,
                                                method: 'Card',
                                                amount: Number(amountToUse),
                                                description: descToUse,
                                            };
                                            setSales((prev) => [
                                                tempSale,
                                                ...(prev || []),
                                            ]);
                                            setSubmitting(true);
                                            router.post(
                                                `/office/${activeShift?.id}/record-sale`,
                                                {
                                                    product_id: selectedItem
                                                        ? selectedItem.actual_id
                                                        : null,
                                                    item_type: selectedItem
                                                        ? selectedItem.type
                                                        : 'custom',
                                                    method: 'Card',
                                                    amount: amountToUse,
                                                    description: descToUse,
                                                },
                                                {
                                                    onSuccess: () => {
                                                        setMessage(
                                                            'Custom sale recorded (Card)',
                                                        );
                                                        setCustomSaleItemId(
                                                            'custom',
                                                        );
                                                        setCustomAmount('');
                                                        setCustomDescription(
                                                            '',
                                                        );
                                                    },
                                                    onError: () => {
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (s: any) =>
                                                                    s.id !==
                                                                    tempId,
                                                            ),
                                                        );
                                                        setMessage(
                                                            'Failed to record custom sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
                                                },
                                            );
                                        }}
                                    >
                                        Add Card
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Large container: sales log + details */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Sales log</h3>
                        <div className="text-xs text-muted-foreground">
                            {Array.isArray(sales)
                                ? `${sales.length} sales${sales.length ? ' | ' + summarizeSales(sales) : ''}`
                                : ''}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="max-h-[36rem] overflow-y-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                        {/* <th className="w-1/12">#</th> */}
                                        <th className="w-4/12">Item</th>
                                        <th className="w-2/12">Method</th>
                                        <th className="w-2/12">Amount</th>
                                        <th className="w-3/12">Description</th>
                                        <th className="w-2/12">Sold by</th>
                                        <th className="w-2/12">Sold at</th>
                                    </tr>
                                </thead>
                                <tbody className="mt-2">
                                    {(sales || [])
                                        .slice(0, 12)
                                        .map((s: any) => (
                                            <tr
                                                key={String(s.id)}
                                                className="border-t"
                                            >
                                                {/* <td className="py-3">
                                                <span className="truncate max-w-[4rem] block" title={String(s.id)}>{s.id}</span>
                                            </td>
                                            */}
                                                <td className="py-3">
                                                    <span
                                                        className="block max-w-[20rem] truncate"
                                                        title={
                                                            s.name ??
                                                            s.item ??
                                                            'N/A'
                                                        }
                                                    >
                                                        {s.name ??
                                                            s.item ??
                                                            'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className="block max-w-[8rem] truncate"
                                                        title={String(s.method)}
                                                    >
                                                        {s.method}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="block max-w-[8rem] truncate"
                                                            title={`€${Number(s.amount ?? 0).toFixed(2)}`}
                                                        >
                                                            €
                                                            {Number(
                                                                s.amount ?? 0,
                                                            ).toFixed(2)}
                                                        </span>
                                                        {String(
                                                            s.method,
                                                        ).toLowerCase() ===
                                                            'cash' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    openSaleEditModal(
                                                                        s,
                                                                    )
                                                                }
                                                                aria-label="Edit cash sale"
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
                                                            s.description ??
                                                            s.buyer ??
                                                            ''
                                                        }
                                                    >
                                                        {s.description ??
                                                            s.buyer ??
                                                            ''}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className="block max-w-[16rem] truncate"
                                                        title={
                                                            s.sold_by ??
                                                            s.sold_by_email ??
                                                            s.sold_by_id ??
                                                            'Unknown'
                                                        }
                                                    >
                                                        {s.sold_by ??
                                                            s.sold_by_email ??
                                                            s.sold_by_id ??
                                                            'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <span
                                                        className="block max-w-[12rem] truncate"
                                                        title={
                                                            s.sold_at ??
                                                            s.created_at ??
                                                            ''
                                                        }
                                                    >
                                                        {(s.sold_at ??
                                                        s.created_at)
                                                            ? new Date(
                                                                  s.sold_at ??
                                                                      s.created_at,
                                                              ).toLocaleString()
                                                            : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            disabled={
                                                                submitting
                                                            }
                                                            onClick={() => {
                                                                if (
                                                                    !activeShift ||
                                                                    submitting
                                                                )
                                                                    return;
                                                                const saleId =
                                                                    s.id;
                                                                // optimistic remove
                                                                setSales(
                                                                    (prev) =>
                                                                        (
                                                                            prev ||
                                                                            []
                                                                        ).filter(
                                                                            (
                                                                                x: any,
                                                                            ) =>
                                                                                x.id !==
                                                                                saleId,
                                                                        ),
                                                                );
                                                                setSubmitting(
                                                                    true,
                                                                );

                                                                router.post(
                                                                    `/office/${activeShift?.id}/remove-sale`,
                                                                    {
                                                                        sale_id:
                                                                            saleId,
                                                                    },
                                                                    {
                                                                        preserveScroll: true,
                                                                        onSuccess:
                                                                            () =>
                                                                                setMessage(
                                                                                    'Sale removed',
                                                                                ),
                                                                        onError:
                                                                            () => {
                                                                                // rollback
                                                                                setSales(
                                                                                    (
                                                                                        prev,
                                                                                    ) => [
                                                                                        s,
                                                                                        ...(prev ||
                                                                                            []),
                                                                                    ],
                                                                                );
                                                                                setMessage(
                                                                                    'Failed to remove sale',
                                                                                );
                                                                            },
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sale edit modal */}
                    <Dialog
                        open={isSaleEditOpen}
                        onOpenChange={(v) => {
                            setIsSaleEditOpen(v);
                            if (!v) setEditingSale(null);
                            setIsPollingPaused(v);
                        }}
                    >
                        <DialogContent>
                            <DialogTitle>Edit cash transaction</DialogTitle>
                            <DialogDescription>
                                Adjust the cash denominations to change the sale
                                amount.
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
                                    { key: 'token', label: 'Pink Token' },
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
                                                            [d.key]: Math.max(
                                                                0,
                                                                (prev[d.key] ||
                                                                    0) - 1,
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
                                                    saleEditBreakdown[d.key] ??
                                                        0,
                                                )}
                                                onChange={(e) => {
                                                    const v = Number(
                                                        e.target.value || 0,
                                                    );
                                                    setSaleEditBreakdown(
                                                        (prev) => ({
                                                            ...prev,
                                                            [d.key]: Math.max(
                                                                0,
                                                                Math.floor(v),
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
                                                                (prev[d.key] ||
                                                                    0) + 1,
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
                                            if (!activeShift || !editingSale)
                                                return;
                                            setSubmitting(true);
                                            const computed = Number(
                                                computeBreakdownTotal(
                                                    saleEditBreakdown,
                                                ).toFixed(2),
                                            );
                                            const amountToUse =
                                                computed > 0
                                                    ? computed
                                                    : Number(
                                                          editingSale.amount ||
                                                              0,
                                                      );

                                            // optimistic update in UI
                                            setSales((prev) =>
                                                (prev || []).map((x: any) =>
                                                    x.id === editingSale.id
                                                        ? {
                                                              ...x,
                                                              amount: amountToUse,
                                                          }
                                                        : x,
                                                ),
                                            );

                                            router.post(
                                                `/office/${activeShift.id}/update-sale`,
                                                {
                                                    sale_id: editingSale.id,
                                                    amount: amountToUse,
                                                    breakdown:
                                                        saleEditBreakdown,
                                                },
                                                {
                                                    onSuccess: () => {
                                                        setMessage(
                                                            'Sale updated',
                                                        );
                                                        setIsSaleEditOpen(
                                                            false,
                                                        );
                                                    },
                                                    onError: () => {
                                                        // rollback by refetching the shift
                                                        router.get(
                                                            `/office/${activeShift.id}`,
                                                            {},
                                                            {
                                                                preserveState: true,
                                                                only: [
                                                                    'activeShift',
                                                                ],
                                                            },
                                                        );
                                                        setMessage(
                                                            'Failed to update sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
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
                    {/* View-only cash breakdown for this shift */}
                    <Dialog
                        open={isViewCashBreakdownOpen}
                        onOpenChange={(v) => {
                            setIsViewCashBreakdownOpen(v);
                            setIsPollingPaused(v);
                        }}
                    >
                        <DialogContent>
                            <DialogTitle>Cash distribution</DialogTitle>
                            <DialogDescription>
                                Read-only cash distribution for this shift.
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
                                    { key: 'token', label: 'Pink Token' },
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
                                                (activeShift?.cash_breakdown ||
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
                                            activeShift?.cash_breakdown || {},
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
                    <div className="mt-6 flex justify-end gap-4">
                        <div className="text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Cash</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsViewCashBreakdownOpen(true)
                                    }
                                    title="View cash distribution"
                                    className="inline-flex items-center justify-center rounded-full border-0 bg-transparent p-0.5 transition-colors hover:bg-muted/20"
                                    style={{ lineHeight: 1 }}
                                >
                                    ?
                                </button>
                            </div>
                            <div className="font-medium">
                                €{cashTotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="text-sm">
                            <div className="text-muted-foreground">Card</div>
                            <div className="font-medium">
                                €{cardTotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="text-sm">
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-semibold">
                                €{combinedTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
