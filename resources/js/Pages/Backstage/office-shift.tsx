import { Alert, AlertTitle } from '@/Components/Shared/ui/alert';
import { Badge } from '@/Components/Shared/ui/badge';
import { Button } from '@/Components/Shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/Components/Shared/ui/dialog';
import { Input } from '@/Components/Shared/ui/input';
import AppLayout from '@/layouts/Backstage/app-layout';
import { BreadcrumbItem, OfficeShift, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Check, Eye, HelpCircle, Pencil } from 'lucide-react';
import * as React from 'react';
import useSWR from 'swr';
import { route } from 'ziggy-js';

const denominationConfig = [
    { key: '50e', label: '€50' },
    { key: '20e', label: '€20' },
    { key: '10e', label: '€10' },
    { key: '5e', label: '€5' },
    { key: '2e', label: '€2' },
    { key: '1e', label: '€1' },
    { key: '50c', label: '50¢' },
    { key: '20c', label: '20¢' },
    { key: '10c', label: '10¢' },
    { key: '5c', label: '5¢' },
    { key: '2c', label: '2¢' },
    { key: '1c', label: '1¢' },
    { key: 'token', label: 'Pink Token' },
];

const mergeBreakdowns = (b1: any, b2: any): Record<string, number> => {
    const merged: Record<string, number> = {};
    denominationConfig.forEach((d) => {
        const key = d.key;
        const val1 = Number(b1?.[key] || 0);
        const val2 = Number(b2?.[key] || 0);
        merged[key] = val1 + val2;
    });
    return merged;
};

export default function Office() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Office Shifts',
            href: route('office'),
        },
    ];

    const { props: initialProps, version } = usePage<SharedData>();
    const [props, setProps] = React.useState(initialProps);

    const fetcher = (url: string) =>
        axios
            .get(url, {
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': version,
                },
            })
            .then((res) => res.data);

    const { mutate } = useSWR(
        initialProps.activeShift
            ? `/office/${initialProps.activeShift.id}`
            : null,
        fetcher,
        {
            refreshInterval: 0,
            onSuccess: (newData) => {
                if (newData?.props) {
                    setProps(newData.props);
                }
            },
        },
    );
    const rawSellables = props['sellables'];
    const sellables = React.useMemo(
        () => (Array.isArray(rawSellables) ? rawSellables : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [JSON.stringify(rawSellables)],
    );
    const activeShift: OfficeShift | null | undefined =
        props['activeShift'] ?? null;

    React.useEffect(() => {
        if (activeShift && window.Echo) {
            window.Echo.private(`office.${activeShift.id}`).listen(
                'OfficeSaleCreated',
                () => {
                    // Force SWR to revalidate and fetch fresh data
                    mutate(undefined, { revalidate: true });
                },
            );

            window.Echo.private('inventory').listen('InventoryUpdated', () => {
                // Force SWR to revalidate and fetch fresh data
                mutate(undefined, { revalidate: true });
            });

            return () => {
                window.Echo?.leave(`office.${activeShift.id}`);
                window.Echo?.leave('inventory');
            };
        }
    }, [activeShift, mutate]);

    const isEventInSellWindow = React.useCallback((item: any) => {
        if (!item) return false;
        if (item.type !== 'event') return true;

        const now = new Date();

        if (item.start_sell_date) {
            const start = new Date(item.start_sell_date);
            if (!isNaN(start.getTime()) && now.getTime() < start.getTime()) {
                return false;
            }
        }

        if (item.end_sell_date) {
            const end = new Date(item.end_sell_date);
            if (!isNaN(end.getTime()) && now.getTime() > end.getTime()) {
                return false;
            }
        }

        return true;
    }, []);

    const filteredSellables = React.useMemo(
        () => sellables.filter((s) => isEventInSellWindow(s)),
        [sellables, isEventInSellWindow],
    );

    const [workers, setWorkers] = React.useState<any[]>([]);
    const [sales, setSales] = React.useState<any[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    // Variant Mode
    const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
    const [selectedVariantProduct, setSelectedVariantProduct] = React.useState<any | null>(null);
    const [pendingVariantAction, setPendingVariantAction] = React.useState<'cash' | 'card' | null>(null);
    const [pendingVariantContext, setPendingVariantContext] = React.useState<any | null>(null);

    React.useEffect(() => {
        if (activeShift) {
            setSales(activeShift.sales || []);
            setWorkers(activeShift.workers || []);
        }
    }, [activeShift]);

    React.useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const rawStaff = props['staff'];
    const staff = React.useMemo(
        () => (Array.isArray(rawStaff) ? rawStaff : []),
        [rawStaff],
    );
    const staffMap = React.useMemo(
        () => new Map(staff.map((s: any) => [s.email, s.name])),
        [staff],
    );

    const staffData = (Array.isArray(props['staff']) ? props['staff'] : []).map(
        (m: any) => ({
            id: m.id,
            name: String(m.name || ''),
            role: String(m.role ?? ''),
            email: String(m.email ?? ''),
            onShift: Boolean((workers || []).find((w: any) => w.id === m.id)),
        }),
    );

    staffData.sort((a: any, b: any) => {
        if (a.onShift === b.onShift) return a.name.localeCompare(b.name);
        return a.onShift ? -1 : 1;
    });

    // Paginate sales log: show up to pageSize per page with editable page index
    const pageSize = 100;
    const [salesPage, setSalesPage] = React.useState<number>(1);

    const totalSalesPages = Math.max(
        1,
        Math.ceil(((sales || []).length || 0) / pageSize),
    );

    const visibleSales = React.useMemo(() => {
        return (sales || [])
            .slice()
            .sort((a: any, b: any) => {
                const ta = new Date(a.sold_at ?? a.created_at).getTime() || 0;
                const tb = new Date(b.sold_at ?? b.created_at).getTime() || 0;
                return tb - ta; // newest first
            })
            .slice((salesPage - 1) * pageSize, salesPage * pageSize);
    }, [sales, salesPage]);

    // Keep current page within bounds when sales list changes
    React.useEffect(() => {
        if (salesPage > totalSalesPages) setSalesPage(totalSalesPages);
        if (salesPage < 1) setSalesPage(1);
    }, [totalSalesPages, salesPage]);

    const [saleProductId, setSaleProductId] = React.useState<string | null>(
        filteredSellables.length ? filteredSellables[0].actual_id : null,
    );
    const [saleItemType, setSaleItemType] = React.useState<'product' | 'event'>(
        filteredSellables.length ? filteredSellables[0].type : 'product',
    );
    const [saleTicketType, setSaleTicketType] = React.useState<
        'with_card' | 'without_card'
    >('with_card');

    // Only initialize on mount, don't reset when filteredSellables changes
    React.useEffect(() => {
        if (filteredSellables.length && saleProductId === null) {
            setSaleProductId(filteredSellables[0].actual_id ?? null);
            setSaleItemType(filteredSellables[0].type ?? 'product');
        }
    }, [filteredSellables, saleProductId]);

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

    const [startTotals, setStartTotals] = React.useState<{
        cash: number;
        card: number;
    }>({
        cash: Number(activeShift?.start_cash ?? 0),
        card: Number(activeShift?.start_card ?? 0),
    });
    const [editingStart, setEditingStart] = React.useState<{
        cash: boolean;
        card: boolean;
    }>({ cash: false, card: false });
    const [pendingStart, setPendingStart] = React.useState<{
        cash: number;
        card: number;
    } | null>(null);

    const [startCollapsed, setStartCollapsed] = React.useState<boolean>(false);
    const [activeCollapsed, setActiveCollapsed] =
        React.useState<boolean>(false);
    const [totalCollapsed, setTotalCollapsed] = React.useState<boolean>(false);

    const revenueRef = React.useRef<HTMLDivElement>(null);
    const [revenueHeight, setRevenueHeight] = React.useState<number | null>(
        null,
    );

    React.useEffect(() => {
        if (!revenueRef.current) return;
        const updateHeight = () => {
            if (revenueRef.current) {
                const height =
                    revenueRef.current.getBoundingClientRect().height;
                setRevenueHeight(height);
            }
        };
        const initialTimer = setTimeout(updateHeight, 0);
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateHeight);
        });
        resizeObserver.observe(revenueRef.current);
        return () => {
            clearTimeout(initialTimer);
            resizeObserver.disconnect();
        };
    }, [
        startCollapsed,
        activeCollapsed,
        totalCollapsed,
        editingStart.cash,
        editingStart.card,
        pendingStart,
        sales,
        workers,
    ]);

    React.useEffect(() => {
        if (activeShift && !editingStart.cash && !editingStart.card) {
            setStartTotals({
                cash: Number(activeShift.start_cash ?? 0),
                card: Number(activeShift.start_card ?? 0),
            });
        }
    }, [
        activeShift,
        activeShift?.start_cash,
        activeShift?.start_card,
        editingStart.cash,
        editingStart.card,
    ]);

    const defaultCashState = {
        '50e': 0,
        '20e': 0,
        '10e': 0,
        '5e': 0,
        '2e': 0,
        '1e': 0,
        '50c': 0,
        '20c': 0,
        '10c': 0,
        '5c': 0,
        '2c': 0,
        '1c': 0,
        token: 0,
    };
    const [isCashModalOpen, setIsCashModalOpen] = React.useState(false);
    const [cashBreakdown, setCashBreakdown] =
        React.useState<Record<string, number>>(defaultCashState);
    const [isCustomCashModalOpen, setIsCustomCashModalOpen] =
        React.useState(false);
    const [customCashBreakdown, setCustomCashBreakdown] =
        React.useState<Record<string, number>>(defaultCashState);
    const [quickSaleContext, setQuickSaleContext] = React.useState<any | null>(
        null,
    );

    const openCashModalForStart = () => {
        const existing = activeShift?.start_cash_breakdown ?? null;
        const init = { ...defaultCashState };
        if (existing && typeof existing === 'object') {
            for (const k of Object.keys(init) as Array<keyof typeof init>) {
                init[k] = Number(existing[k] ?? 0);
            }
        }
        setCashBreakdown(init);
        setIsCashModalOpen(true);
    };

    const computeBreakdownTotal = (b: Record<string, number> | null) => {
        if (!b) return 0;
        const values: Record<string, number> = {
            '50e': 50,
            '20e': 20,
            '10e': 10,
            '5e': 5,
            '2e': 2,
            '1e': 1,
            '50c': 0.5,
            '20c': 0.2,
            '10c': 0.1,
            '5c': 0.05,
            '2c': 0.02,
            '1c': 0.01,
            token: 0,
        };
        let t = 0;
        for (const k of Object.keys(values)) {
            t += (Number(b[k] ?? 0) || 0) * values[k];
        }
        return t;
    };

    const [customCashModalTitle, setCustomCashModalTitle] =
        React.useState('Cash Sale');

    const openCustomCashModal = (context: any | null = null) => {
        setCustomCashBreakdown({ ...defaultCashState });
        if (context) {
            const selectedItem = filteredSellables.find(
                (i: any) => i.actual_id === context.productId,
            );
            if (selectedItem) {
                let price = selectedItem.price;
                if (selectedItem.type === 'event') {
                    price =
                        context.ticketType === 'with_card'
                            ? selectedItem.price_with_card
                            : selectedItem.price_without_card;
                }
                setCustomCashModalTitle(
                    `Cash Sale: ${selectedItem.name} (€${Number(price).toFixed(2)})`,
                );
            }
        } else {
            setCustomCashModalTitle('Cash breakdown for Custom Sale');
        }
        setQuickSaleContext(context);
        setIsCustomCashModalOpen(true);
    };

    const [isSaleEditOpen, setIsSaleEditOpen] = React.useState(false);
    const [editingSale, setEditingSale] = React.useState<any | null>(null);
    const [saleEditBreakdown, setSaleEditBreakdown] =
        React.useState<Record<string, number>>(defaultCashState);
    const [isViewingLiveCashBreakdown, setIsViewingLiveCashBreakdown] =
        React.useState(false);
    const [isViewingTotalCashBreakdown, setIsViewingTotalCashBreakdown] =
        React.useState(false);

    const openSaleEditModal = (sale: any) => {
        setEditingSale(sale);
        const existing = sale?.breakdown;
        if (existing && typeof existing === 'object') {
            const init = { ...defaultCashState };
            for (const k of Object.keys(init) as Array<keyof typeof init>) {
                init[k] = Number(existing[k] ?? 0);
            }
            setSaleEditBreakdown(init);
            setIsSaleEditOpen(true);
            return;
        }
        const amt = Number(sale?.amount ?? 0) || 0;
        const denominations: Array<{ key: string; value: number }> = [
            { key: '50e', value: 50 },
            { key: '20e', value: 20 },
            { key: '10e', value: 10 },
            { key: '5e', value: 5 },
            { key: '2e', value: 2 },
            { key: '1e', value: 1 },
            { key: '50c', value: 0.5 },
            { key: '20c', value: 0.2 },
            { key: '10c', value: 0.1 },
            { key: 'token', value: 0 },
        ];
        let remaining = Math.round(amt * 100) / 100;
        const derived = { ...defaultCashState };
        for (const d of denominations) {
            if (d.value === 0) continue;
            const count = Math.floor(remaining / d.value);
            if (count > 0) {
                derived[d.key as keyof typeof derived] = count;
                remaining =
                    Math.round((remaining - count * d.value) * 100) / 100;
            }
        }
        setSaleEditBreakdown(derived);
        setIsSaleEditOpen(true);
    };

    // Sold-out modal state
    const [isSoldOutModalOpen, setIsSoldOutModalOpen] = React.useState(false);
    const [soldOutText, setSoldOutText] = React.useState('');

    const totalCash = Number(startTotals.cash ?? 0) + cashTotal;
    const totalCard = Number(startTotals.card ?? 0) + cardTotal;
    const totalCombined = totalCash + totalCard;

    const totalCashBreakdown = React.useMemo(() => {
        return mergeBreakdowns(
            activeShift?.start_cash_breakdown,
            activeShift?.cash_breakdown,
        );
    }, [activeShift?.start_cash_breakdown, activeShift?.cash_breakdown]);

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

    // Helper to compute a human-friendly remaining text for sellables
    const getRemainingTextForItem = (item: any) => {
        if (!item) return '0 remaining';

        // For variable-amount events, prefer per-ticket quantities
        if (item.type === 'event' && item.variable_amount) {
            const withUnlimited = item.unlimited_quantity_with_card;
            const withoutUnlimited = item.unlimited_quantity_without_card;

            // If either is unlimited, we can simplify the display
            if (withUnlimited && withoutUnlimited) return 'Unlimited';
            if (withUnlimited) return 'Unlimited w/ card';
            if (withoutUnlimited) return 'Unlimited w/o card';

            const withQty =
                typeof item.remaining_with_card === 'number'
                    ? item.remaining_with_card
                    : 'N/A';
            const withoutQty =
                typeof item.remaining_without_card === 'number'
                    ? item.remaining_without_card
                    : 'N/A';

            return `${withQty} w/ card, ${withoutQty} w/o card`;
        }

        // Non-variable events or products: check for explicit unlimited flags
        const isUnlimited =
            item.unlimited_quantity ||
            item.unlimited_quantity_with_card ||
            item.unlimited_quantity_without_card;
        if (isUnlimited) return 'Unlimited';

        // Prefer explicit `remaining` if present, otherwise it's effectively 0 or not set
        const rem = typeof item.remaining === 'number' ? item.remaining : 0;

        return `${rem} remaining`;
    };

    const getPerTicketBreakdown = (item: any) => {
        if (!item) return '';
        const withUnlimited = Boolean(item.unlimited_quantity_with_card);
        const withoutUnlimited = Boolean(item.unlimited_quantity_without_card);
        const withQty =
            Number(item.remaining_with_card ?? item.quantity_with_card ?? 0) ||
            0;
        const withoutQty =
            Number(
                item.remaining_without_card ?? item.quantity_without_card ?? 0,
            ) || 0;
        const withText = withUnlimited ? 'Unlimited' : `${withQty}`;
        const withoutText = withoutUnlimited ? 'Unlimited' : `${withoutQty}`;
        return `w/ ESNcard: ${withText} | w/o ESNcard: ${withoutText}`;
    };

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
        grouped.sort((a, b) => {
            const diff = a.count - b.count;
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
        });
        return grouped.map((g) => `${g.name} ${g.count}`).join(' | ');
    };

    const handleVariantConfirm = (options: any) => {
        const type = pendingVariantAction;
        const context = pendingVariantContext;

        setIsVariantModalOpen(false);
        setPendingVariantAction(null);
        setPendingVariantContext(null);
        setSelectedVariantProduct(null);

        if (!type) return;

        if (type === 'cash') {
            // Add options to context
            const ctx = { ...context, options };
            openCustomCashModal(ctx);
        } else {
            // Card - custom sale flow
            addCustomCardSale(options);
        }
    };

    const handleSaleAction = (
        type: 'cash' | 'card',
        context: any = null,
    ) => {
        let productId = context?.productId;
        let isFromCustomSaleSection = false;

        // Custom Sale Section logic inference
        if (!context && customSaleItemId !== 'custom') {
            productId = customSaleItemId;
            isFromCustomSaleSection = true;
        }

        const product = sellables.find(
            (s: any) => String(s.actual_id) === String(productId),
        );

        // Build context for Custom sale section with a selected product/event
        let effectiveContext = context;
        if (isFromCustomSaleSection && product) {
            effectiveContext = {
                productId: product.actual_id,
                itemType: product.type,
                isCustomSale: true, // Flag to indicate this is from Custom sale section
            };
        }

        // If variant based, interrupt flow
        if (product && product.is_variant_based) {
            setPendingVariantAction(type);
            setPendingVariantContext(effectiveContext);
            setSelectedVariantProduct(product);
            setIsVariantModalOpen(true);
            return;
        }

        // Normal flow
        if (type === 'cash') {
            openCustomCashModal(effectiveContext);
        } else {
            addCustomCardSale();
        }
    };

    const addCustomCardSale = (variantOptions: any = null) => {
        if (!activeShift || !customAmount || !customDescription) return;
        const isCustom = customSaleItemId === 'custom';
        const selectedItem = isCustom
            ? null
            : filteredSellables.find(
                (i: any) => String(i.actual_id) === String(customSaleItemId),
            );
        const amountToUse = String(customAmount);
        const descToUse = String(customDescription || '');
        const itemName = selectedItem ? selectedItem.name : 'Custom Sale';
        const tempId = `tmp-${Date.now()}`;
        const tempSale: any = {
            id: tempId,
            name: itemName,
            method: 'card',
            amount: Number(amountToUse),
            description: descToUse,
        };
        setSales((prev) => [tempSale, ...(prev || [])]);
        setSubmitting(true);

        axios
            .post('/online-sales', {
                office_shift_id: activeShift?.id,
                product_id:
                    selectedItem && selectedItem.type === 'product'
                        ? selectedItem.actual_id
                        : null,
                event_id:
                    selectedItem && selectedItem.type === 'event'
                        ? selectedItem.actual_id
                        : null,
                method: 'card',
                amount: amountToUse,
                name: itemName,
                description: descToUse,
                is_manual_entry: true, // Flag to indicate this was manually entered
                details: variantOptions ? { options: variantOptions } : null,
            })
            .then(() => {
                setMessage('Custom sale recorded (Card)');
                setCustomSaleItemId('custom');
                setCustomAmount('');
                setCustomDescription('');
                mutate();
            })
            .catch((err: any) => {
                setSales((prev) =>
                    (prev || []).filter((s: any) => s.id !== tempId),
                );
                const status = err?.response?.status;
                const stockErr = err?.response?.data?.errors?.stock;
                if (status === 422 && stockErr) {
                    const text = Array.isArray(stockErr)
                        ? stockErr.join(' | ')
                        : String(stockErr);
                    setSoldOutText(text);
                    setIsSoldOutModalOpen(true);
                } else {
                    setMessage('Failed to record custom sale');
                }
            })
            .finally(() => setSubmitting(false));
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

                <div className="grid gap-4 md:grid-cols-3 md:items-start">
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
                                                        submitting ||
                                                        activeShift?.status ===
                                                        'closed'
                                                    }
                                                    onClick={() => {
                                                        if (!activeShift)
                                                            return;
                                                        setWorkers((prev) => [
                                                            {
                                                                id: member.id,
                                                                name: member.name,
                                                                role: member.role,
                                                                email: member.email,
                                                            },
                                                            ...(prev || []),
                                                        ]);
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
                                                                onSuccess:
                                                                    () => {
                                                                        setMessage(
                                                                            'Worker added',
                                                                        );
                                                                        mutate();
                                                                    },
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
                                                        disabled={
                                                            submitting ||
                                                            activeShift?.status ===
                                                            'closed'
                                                        }
                                                        onClick={() => {
                                                            if (!activeShift)
                                                                return;
                                                            setWorkers((prev) =>
                                                                (
                                                                    prev || []
                                                                ).filter(
                                                                    (w: any) =>
                                                                        w.id !==
                                                                        member.id,
                                                                ),
                                                            );
                                                            router.post(
                                                                `/office/${activeShift.id}/remove-worker`,
                                                                {
                                                                    user_id:
                                                                        member.id,
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
                                                                        () => {
                                                                            setMessage(
                                                                                'Worker removed',
                                                                            );
                                                                            mutate();
                                                                        },
                                                                    onError:
                                                                        () => {
                                                                            setWorkers(
                                                                                (
                                                                                    prev,
                                                                                ) => [
                                                                                        {
                                                                                            id: member.id,
                                                                                            name: member.name,
                                                                                            role: member.role,
                                                                                            email: member.email,
                                                                                        },
                                                                                        ...(prev ||
                                                                                            []),
                                                                                    ],
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

                    <section
                        ref={revenueRef}
                        className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
                    >
                        <h3 className="text-sm font-semibold">Revenue</h3>
                        <div className="mt-4 space-y-3">
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
                                <Dialog
                                    open={isCustomCashModalOpen}
                                    onOpenChange={(v) => {
                                        setIsCustomCashModalOpen(v);
                                        if (!v) setQuickSaleContext(null);
                                    }}
                                >
                                    <DialogContent>
                                        <DialogTitle>
                                            {customCashModalTitle}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Provide the counts of bills, coins
                                            and tokens.
                                        </DialogDescription>
                                        <div className="mt-4 grid grid-cols-1 gap-3">
                                            {denominationConfig.map((d) => (
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
                                                            onClick={() =>
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
                                                                )
                                                            }
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
                                                            onChange={(e) =>
                                                                setCustomCashBreakdown(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [d.key]:
                                                                            Math.max(
                                                                                0,
                                                                                Math.floor(
                                                                                    Number(
                                                                                        e
                                                                                            .target
                                                                                            .value ||
                                                                                        0,
                                                                                    ),
                                                                                ),
                                                                            ),
                                                                    }),
                                                                )
                                                            }
                                                            className="w-20 rounded-md border p-1 text-right"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
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
                                                                )
                                                            }
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
                                                    disabled={submitting}
                                                    onClick={() => {
                                                        if (!activeShift)
                                                            return;
                                                        setSubmitting(true);
                                                        const computed = Number(
                                                            computeBreakdownTotal(
                                                                customCashBreakdown,
                                                            ).toFixed(2),
                                                        );
                                                        // isQuick = true only if we have a context from Quick add sale section
                                                        // If context has isCustomSale flag, it's from Custom sale section
                                                        const isQuick =
                                                            Boolean(
                                                                quickSaleContext,
                                                            ) && !quickSaleContext?.isCustomSale;
                                                        let amountToUse = 0;
                                                        let selectedItem = null;
                                                        let itemName =
                                                            'Custom Sale';
                                                        let productIdToSend =
                                                            null;
                                                        let itemTypeToSend =
                                                            'custom';
                                                        let descToUse = String(
                                                            customDescription ||
                                                            '',
                                                        );
                                                        let ticketTypeToSend =
                                                            undefined;
                                                        let ticketLabelToSend =
                                                            undefined;
                                                        let optionsToSend =
                                                            undefined;

                                                        // For Custom sale section with a selected product/event (including variants)
                                                        if (quickSaleContext?.isCustomSale) {
                                                            selectedItem =
                                                                filteredSellables.find(
                                                                    (i: any) =>
                                                                        String(i.actual_id) ===
                                                                        String(quickSaleContext.productId),
                                                                );
                                                            productIdToSend =
                                                                quickSaleContext.productId;
                                                            itemTypeToSend =
                                                                quickSaleContext.itemType || (selectedItem ? selectedItem.type : 'custom');
                                                            optionsToSend =
                                                                quickSaleContext.options;
                                                            amountToUse =
                                                                computed > 0
                                                                    ? computed
                                                                    : Number(
                                                                        customAmount ||
                                                                        0,
                                                                    );
                                                            itemName =
                                                                selectedItem
                                                                    ? selectedItem.name
                                                                    : 'Custom Sale';
                                                            // Keep descToUse from customDescription (already set above)
                                                        } else if (isQuick) {
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
                                                            optionsToSend =
                                                                quickSaleContext.options;
                                                            if (computed > 0)
                                                                amountToUse =
                                                                    computed;
                                                            else if (
                                                                selectedItem
                                                            ) {
                                                                if (
                                                                    selectedItem.type ===
                                                                    'product'
                                                                )
                                                                    amountToUse =
                                                                        Number(
                                                                            selectedItem.price ||
                                                                            0,
                                                                        );
                                                                else
                                                                    amountToUse =
                                                                        Number(
                                                                            quickSaleContext.ticketType ===
                                                                                'with_card'
                                                                                ? selectedItem.price_with_card
                                                                                : selectedItem.price_without_card,
                                                                        ) || 0;
                                                            }
                                                            itemName =
                                                                selectedItem
                                                                    ? selectedItem.name
                                                                    : 'Quick Sale';
                                                            descToUse = '';
                                                        } else {
                                                            amountToUse =
                                                                computed > 0
                                                                    ? computed
                                                                    : Number(
                                                                        customAmount ||
                                                                        0,
                                                                    );
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
                                                                            String(
                                                                                i.actual_id,
                                                                            ) ===
                                                                            String(
                                                                                customSaleItemId,
                                                                            ),
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
                                                            method: 'cash',
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
                                                        router.post(
                                                            `/office/${activeShift?.id}/record-sale`,
                                                            {
                                                                product_id:
                                                                    productIdToSend,
                                                                item_type:
                                                                    itemTypeToSend,
                                                                method: 'cash',
                                                                amount: amountToUse,
                                                                description:
                                                                    descToUse,
                                                                ticket_type:
                                                                    ticketTypeToSend,
                                                                ticket_label:
                                                                    ticketLabelToSend,
                                                                options: optionsToSend,
                                                                breakdown:
                                                                    customCashBreakdown,
                                                                is_manual_entry:
                                                                    !isQuick, // True if from Custom sale section, false if from Quick add sale
                                                            },
                                                            {
                                                                onSuccess:
                                                                    () => {
                                                                        setMessage(
                                                                            'Sale recorded (Cash)',
                                                                        );
                                                                        setIsCustomCashModalOpen(
                                                                            false,
                                                                        );
                                                                        setCustomSaleItemId(
                                                                            'custom',
                                                                        );
                                                                        setCustomAmount(
                                                                            '',
                                                                        );
                                                                        setCustomDescription(
                                                                            '',
                                                                        );
                                                                        setQuickSaleContext(
                                                                            null,
                                                                        );
                                                                    },
                                                                onError: (
                                                                    errors: any,
                                                                ) => {
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
                                                                    const stockErr =
                                                                        errors?.stock ||
                                                                        errors?.sold_out;
                                                                    if (
                                                                        stockErr
                                                                    ) {
                                                                        const text =
                                                                            Array.isArray(
                                                                                stockErr,
                                                                            )
                                                                                ? stockErr.join(
                                                                                    ' | ',
                                                                                )
                                                                                : String(
                                                                                    stockErr,
                                                                                );
                                                                        setSoldOutText(
                                                                            text,
                                                                        );
                                                                        setIsSoldOutModalOpen(
                                                                            true,
                                                                        );
                                                                    } else {
                                                                        setMessage(
                                                                            'Failed to record sale',
                                                                        );
                                                                    }
                                                                },
                                                                onFinish:
                                                                    () => {
                                                                        setSubmitting(
                                                                            false,
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
                                                                const originalTotals =
                                                                {
                                                                    ...startTotals,
                                                                };
                                                                const newCash =
                                                                    pendingStart?.cash ??
                                                                    startTotals.cash;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                setStartTotals(
                                                                    (s) => ({
                                                                        ...s,
                                                                        cash: newCash,
                                                                    }),
                                                                );
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        cash: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: newCash,
                                                                        card: startTotals.card,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Start cash updated',
                                                                                );
                                                                                mutate();
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start cash',
                                                                                );
                                                                                setStartTotals(
                                                                                    originalTotals,
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
                                                            disabled={
                                                                activeShift?.status ===
                                                                'closed'
                                                            }
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
                                                                const originalTotals =
                                                                {
                                                                    ...startTotals,
                                                                };
                                                                const newCard =
                                                                    pendingStart?.card ??
                                                                    startTotals.card;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                setStartTotals(
                                                                    (s) => ({
                                                                        ...s,
                                                                        card: newCard,
                                                                    }),
                                                                );
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        card: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: startTotals.cash,
                                                                        card: newCard,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Start card updated',
                                                                                );
                                                                                mutate();
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start card',
                                                                                );
                                                                                setStartTotals(
                                                                                    originalTotals,
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
                                                            disabled={
                                                                activeShift?.status ===
                                                                'closed'
                                                            }
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
                                        </div>{' '}
                                        <Dialog
                                            open={isCashModalOpen}
                                            onOpenChange={(v) => {
                                                setIsCashModalOpen(v);
                                            }}
                                        >
                                            <DialogContent>
                                                <DialogTitle>
                                                    Cash breakdown
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Enter counts for each
                                                    denomination.
                                                </DialogDescription>
                                                <div className="mt-4 grid grid-cols-1 gap-3">
                                                    {denominationConfig.map(
                                                        (d) => (
                                                            <div
                                                                key={d.key}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                                        {
                                                                            d.label
                                                                        }
                                                                    </div>
                                                                    {/* <div className="text-sm text-muted-foreground">
                                                                        {d.label ===
                                                                            'Pink Token'
                                                                            ? 'jeton'
                                                                            : ''}
                                                                    </div> */}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
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
                                                                            )
                                                                        }
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
                                                                            ] ??
                                                                            0,
                                                                        )}
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setCashBreakdown(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [d.key]:
                                                                                        Math.max(
                                                                                            0,
                                                                                            Math.floor(
                                                                                                Number(
                                                                                                    e
                                                                                                        .target
                                                                                                        .value ||
                                                                                                    0,
                                                                                                ),
                                                                                            ),
                                                                                        ),
                                                                                }),
                                                                            )
                                                                        }
                                                                        className="w-20 rounded-md border p-1 text-right"
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() =>
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
                                                                            )
                                                                        }
                                                                    >
                                                                        +
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
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
                                                                const originalTotals =
                                                                {
                                                                    ...startTotals,
                                                                };
                                                                const newCash =
                                                                    Number(
                                                                        computeBreakdownTotal(
                                                                            cashBreakdown,
                                                                        ).toFixed(
                                                                            2,
                                                                        ),
                                                                    );
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                setStartTotals(
                                                                    (s) => ({
                                                                        ...s,
                                                                        cash: newCash,
                                                                    }),
                                                                );
                                                                setIsCashModalOpen(
                                                                    false,
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
                                                                                setMessage(
                                                                                    'Start cash breakdown saved',
                                                                                );
                                                                                mutate();
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to save breakdown',
                                                                                );
                                                                                setStartTotals(
                                                                                    originalTotals,
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
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <span>Live Cash</span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5"
                                                    onClick={() =>
                                                        setIsViewingLiveCashBreakdown(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
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
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <span>Cash</span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-5 w-5"
                                                    onClick={() =>
                                                        setIsViewingTotalCashBreakdown(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
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
                                                onSuccess: (page: any) => {
                                                    setMessage('Shift started');
                                                    const newShiftId =
                                                        page.props.activeShift
                                                            ?.id;
                                                    if (newShiftId) {
                                                        router.visit(
                                                            `/office/${newShiftId}`,
                                                        );
                                                    } else {
                                                        router.visit(
                                                            route('office'),
                                                        );
                                                    }
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
                                                End shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Confirm close.
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
                                                        onClick={() =>
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
                                                                            router.visit(
                                                                                route(
                                                                                    'office',
                                                                                ),
                                                                            );
                                                                        },
                                                                },
                                                            )
                                                        }
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
                                                disabled={
                                                    !activeShift ||
                                                    activeShift?.status !==
                                                    'closed'
                                                }
                                            >
                                                Reopen shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Reopen?</DialogTitle>
                                            <DialogDescription>
                                                Confirm reopen.
                                            </DialogDescription>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <DialogClose asChild>
                                                    <Button
                                                        disabled={
                                                            !activeShift ||
                                                            activeShift?.status !==
                                                            'closed'
                                                        }
                                                        onClick={() =>
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
                                                                            mutate();
                                                                        },
                                                                },
                                                            )
                                                        }
                                                    >
                                                        Reopen shift
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}{' '}
                            </div>
                            <div className="mt-2 border-t pt-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium">
                                        Quick add sale
                                    </h4>
                                    <Link href={route('sellables')}>
                                        <Button size="sm" variant="ghost">
                                            Manage
                                        </Button>
                                    </Link>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select
                                        value={String(saleProductId ?? '')}
                                        onChange={(e) => {
                                            const id = e.target.value || null;
                                            setSaleProductId(id);
                                            const item = filteredSellables.find(
                                                (i: any) => i.actual_id === id,
                                            );
                                            if (item)
                                                setSaleItemType(item.type);
                                        }}
                                        className="w-full rounded-md border p-2"
                                        disabled={
                                            activeShift?.status !== 'open'
                                        }
                                    >
                                        {filteredSellables.map((item: any) => {
                                            const remainingText =
                                                getRemainingTextForItem(item);
                                            let label = '';
                                            if (item.type === 'product') {
                                                label = `${item.name} — €${Number(item.price).toFixed(2)} (${remainingText})`;
                                            } else if (
                                                item.type === 'event' &&
                                                item.variable_amount
                                            ) {
                                                label = `${item.name} — Event (${getPerTicketBreakdown(item)})`;
                                            } else {
                                                label = `${item.name} — Event (${remainingText})`;
                                            }
                                            return (
                                                <option
                                                    key={String(
                                                        item.id ??
                                                        item.actual_id,
                                                    )}
                                                    value={item.actual_id}
                                                >
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                {saleItemType === 'event' &&
                                    saleProductId &&
                                    filteredSellables.find(
                                        (i: any) =>
                                            i.actual_id === saleProductId,
                                    ) && (
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
                                                    With ESNcard — €
                                                    {Number(
                                                        filteredSellables.find(
                                                            (i: any) =>
                                                                i.actual_id ===
                                                                saleProductId,
                                                        )?.price_with_card,
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
                                                    Without ESNcard — €
                                                    {Number(
                                                        filteredSellables.find(
                                                            (i: any) =>
                                                                i.actual_id ===
                                                                saleProductId,
                                                        )?.price_without_card,
                                                    ).toFixed(2)}
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        disabled={
                                            activeShift?.status !== 'open' ||
                                            submitting
                                        }
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
                                            handleSaleAction('cash', {
                                                productId: saleProductId,
                                                itemType: selectedItem.type,
                                                ticketType: saleTicketType,
                                                ticketLabel:
                                                    selectedItem.type ===
                                                        'event'
                                                        ? saleTicketType ===
                                                            'with_card'
                                                            ? 'With ESNcard'
                                                            : 'Without ESNcard'
                                                        : undefined,
                                            });
                                        }}
                                    >
                                        Add Cash
                                    </Button>
                                    <div className="flex-1" />
                                </div>
                            </div>

                            <div className="mt-2 border-t pt-2">
                                <h4 className="text-xs font-medium">
                                    Custom sale
                                </h4>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select
                                        value={customSaleItemId}
                                        onChange={(e) =>
                                            setCustomSaleItemId(e.target.value)
                                        }
                                        className="rounded-md border p-2"
                                        disabled={
                                            activeShift?.status !== 'open'
                                        }
                                    >
                                        <option value="custom">Custom</option>
                                        {filteredSellables.map((item: any) => {
                                            const remainingText =
                                                getRemainingTextForItem(item);
                                            let label = '';
                                            if (item.type === 'product') {
                                                label = `${item.name} — €${Number(item.price).toFixed(2)} (${remainingText})`;
                                            } else if (
                                                item.type === 'event' &&
                                                item.variable_amount
                                            ) {
                                                label = `${item.name} — Event (${getPerTicketBreakdown(item)})`;
                                            } else {
                                                label = `${item.name} — Event (${remainingText})`;
                                            }
                                            return (
                                                <option
                                                    key={String(
                                                        item.id ??
                                                        item.actual_id,
                                                    )}
                                                    value={item.actual_id}
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
                                                if (
                                                    value === '' ||
                                                    /^\d*\.?\d*$/.test(value)
                                                )
                                                    setCustomAmount(value);
                                            }}
                                            disabled={
                                                activeShift?.status !== 'open'
                                            }
                                        />
                                    </div>
                                    <Input
                                        placeholder="Description (mandatory)"
                                        value={customDescription}
                                        onChange={(e) =>
                                            setCustomDescription(e.target.value)
                                        }
                                        disabled={
                                            activeShift?.status !== 'open'
                                        }
                                    />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        disabled={
                                            !activeShift ||
                                            !customDescription ||
                                            activeShift?.status !== 'open' ||
                                            submitting
                                        }
                                        onClick={() => {
                                            if (
                                                !activeShift ||
                                                !customDescription
                                            )
                                                return;
                                            handleSaleAction('cash', null);
                                        }}
                                    >
                                        Add Cash
                                    </Button>
                                    <Button
                                        disabled={
                                            !activeShift ||
                                            !customAmount ||
                                            !customDescription ||
                                            activeShift?.status !== 'open' ||
                                            submitting
                                        }
                                        onClick={() => handleSaleAction('card', null)}
                                    >
                                        Add Card
                                    </Button>
                                </div>{' '}
                            </div>
                        </div>
                    </section>
                </div>

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
                                        <th className="w-[20%] px-1">Item</th>
                                        <th className="w-[10%] px-1">Method</th>
                                        <th className="w-[10%] px-1">Amount</th>
                                        <th className="w-[20%] px-1">
                                            Description
                                        </th>
                                        <th className="w-[15%] px-1">
                                            Sold by
                                        </th>
                                        <th className="w-[15%] px-1">
                                            Sold at
                                        </th>
                                        <th className="w-[10%] px-1 text-right">
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>{' '}
                                        {/* Hidden column for alignment */}
                                    </tr>
                                </thead>
                                <tbody className="mt-2">
                                    {visibleSales.map((s: any) => (
                                        <tr
                                            key={String(s.id)}
                                            className="border-t"
                                        >
                                            <td className="overflow-hidden px-1 py-3">
                                                <div
                                                    className="w-full truncate"
                                                    title={
                                                        s.name ??
                                                        s.item ??
                                                        'N/A'
                                                    }
                                                >
                                                    {s.name ?? s.item ?? 'N/A'}
                                                </div>
                                            </td>
                                            <td className="overflow-hidden px-1 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize"
                                                    title={String(s.method)}
                                                >
                                                    {s.method}
                                                </Badge>
                                            </td>
                                            <td className="overflow-hidden px-1 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div
                                                        className="w-full truncate"
                                                        title={`€${Number(s.amount ?? 0).toFixed(2)}`}
                                                    >
                                                        €
                                                        {Number(
                                                            s.amount ?? 0,
                                                        ).toFixed(2)}
                                                    </div>
                                                    {String(
                                                        s.method,
                                                    ).toLowerCase() ===
                                                        'cash' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() =>
                                                                        activeShift?.status ===
                                                                        'open' &&
                                                                        openSaleEditModal(
                                                                            s,
                                                                        )
                                                                    }
                                                                    aria-label="Edit cash sale"
                                                                    disabled={
                                                                        activeShift?.status !==
                                                                        'open'
                                                                    }
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                </div>
                                            </td>
                                            <td className="overflow-hidden px-1 py-3">
                                                <div
                                                    className="w-full truncate"
                                                    title={s.description ?? ''}
                                                >
                                                    {s.description ?? ''}
                                                </div>
                                            </td>
                                            <td className="overflow-hidden px-1 py-3">
                                                <div
                                                    className="w-full truncate"
                                                    title={
                                                        staffMap.get(
                                                            s.sold_by,
                                                        ) ??
                                                        s.sold_by ??
                                                        'Unknown'
                                                    }
                                                >
                                                    {staffMap.get(s.sold_by) ??
                                                        s.sold_by ??
                                                        'Unknown'}
                                                </div>
                                            </td>
                                            <td className="overflow-hidden px-1 py-3">
                                                <div
                                                    className="w-full truncate"
                                                    title={formatDateTime(
                                                        s.sold_at ??
                                                        s.created_at,
                                                    )}
                                                >
                                                    {formatDateTime(
                                                        s.sold_at ??
                                                        s.created_at,
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-1 py-3">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        submitting ||
                                                        activeShift?.status !==
                                                        'open' ||
                                                        (String(
                                                            s.method,
                                                        ).toLowerCase() ===
                                                            'card' &&
                                                            !s.is_manual_entry)
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            !activeShift ||
                                                            submitting
                                                        )
                                                            return;
                                                        const saleId = s.id;
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (x: any) =>
                                                                    x.id !==
                                                                    saleId,
                                                            ),
                                                        );
                                                        setSubmitting(true);
                                                        router.post(
                                                            `/office/${activeShift?.id}/remove-sale`,
                                                            { sale_id: saleId },
                                                            {
                                                                preserveScroll: true,
                                                                onSuccess:
                                                                    () => {
                                                                        setMessage(
                                                                            'Sale removed',
                                                                        );
                                                                        mutate();
                                                                    },
                                                                onError: () => {
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
                                                                onFinish: () =>
                                                                    setSubmitting(
                                                                        false,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Pagination controls for sales log */}
                    {totalSalesPages > 1 && (
                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Page
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded border bg-background/40 px-2 py-1 text-sm disabled:opacity-40"
                                    disabled={salesPage <= 1}
                                    onClick={() =>
                                        setSalesPage((p) => Math.max(1, p - 1))
                                    }
                                >
                                    Prev
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalSalesPages}
                                    value={salesPage}
                                    onChange={(e) => {
                                        const v = Number(e.target.value || 1);
                                        setSalesPage(
                                            Math.min(
                                                Math.max(1, Math.floor(v || 1)),
                                                totalSalesPages,
                                            ),
                                        );
                                    }}
                                    className="w-16 rounded-md border p-1 text-center"
                                />
                                <div className="text-sm text-muted-foreground">
                                    of {totalSalesPages}
                                </div>
                                <button
                                    className="rounded border bg-background/40 px-2 py-1 text-sm disabled:opacity-40"
                                    disabled={salesPage >= totalSalesPages}
                                    onClick={() =>
                                        setSalesPage((p) =>
                                            Math.min(totalSalesPages, p + 1),
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                    <Dialog
                        open={isSaleEditOpen}
                        onOpenChange={(v) => {
                            setIsSaleEditOpen(v);
                            if (!v) setEditingSale(null);
                        }}
                    >
                        <DialogContent>
                            <DialogTitle>Edit cash transaction</DialogTitle>
                            <DialogDescription>
                                Adjust cash denominations.
                            </DialogDescription>
                            <div className="mt-4 grid grid-cols-1 gap-3">
                                {denominationConfig.map((d) => (
                                    <div
                                        key={d.key}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                {d.label}
                                            </div>
                                            {/* <div className="text-sm text-muted-foreground">
                                                {d.label === 'Pink Token'
                                                    ? 'jeton'
                                                    : ''}
                                            </div> */}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setSaleEditBreakdown(
                                                        (prev) => ({
                                                            ...prev,
                                                            [d.key]: Math.max(
                                                                0,
                                                                (prev[d.key] ||
                                                                    0) - 1,
                                                            ),
                                                        }),
                                                    )
                                                }
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
                                                onChange={(e) =>
                                                    setSaleEditBreakdown(
                                                        (prev) => ({
                                                            ...prev,
                                                            [d.key]: Math.max(
                                                                0,
                                                                Math.floor(
                                                                    Number(
                                                                        e.target
                                                                            .value ||
                                                                        0,
                                                                    ),
                                                                ),
                                                            ),
                                                        }),
                                                    )
                                                }
                                                className="w-20 rounded-md border p-1 text-right"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setSaleEditBreakdown(
                                                        (prev) => ({
                                                            ...prev,
                                                            [d.key]:
                                                                (prev[d.key] ||
                                                                    0) + 1,
                                                        }),
                                                    )
                                                }
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
                                            setIsSaleEditOpen(false);
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
                                                        mutate();
                                                    },
                                                    onError: () => {
                                                        setMessage(
                                                            'Failed to update sale',
                                                        );
                                                        mutate();
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
                    <div className="mt-6 flex justify-end gap-4">
                        <div className="text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Cash</span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() =>
                                        setIsViewingLiveCashBreakdown(true)
                                    }
                                >
                                    <HelpCircle className="h-4 w-4" />
                                </Button>
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

                <Dialog
                    open={isViewingLiveCashBreakdown}
                    onOpenChange={setIsViewingLiveCashBreakdown}
                >
                    <DialogContent>
                        <DialogTitle>Live Cash Sales Breakdown</DialogTitle>
                        <DialogDescription>
                            Read-only breakdown of cash sales made during this
                            shift.
                        </DialogDescription>
                        <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                            {denominationConfig.map((d) => (
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
                                            (activeShift?.cash_breakdown || {})[
                                            d.key
                                            ] ?? 0,
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t pt-2">
                                <div className="text-sm text-muted-foreground">
                                    Total
                                </div>
                                <div className="text-lg font-medium">
                                    €
                                    {computeBreakdownTotal(
                                        activeShift?.cash_breakdown || {},
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog
                    open={isViewingTotalCashBreakdown}
                    onOpenChange={setIsViewingTotalCashBreakdown}
                >
                    <DialogContent>
                        <DialogTitle>Total Cash Drawer Breakdown</DialogTitle>
                        <DialogDescription>
                            Read-only breakdown of all cash currently in the
                            drawer (start of shift + live sales).
                        </DialogDescription>
                        <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                            {denominationConfig.map((d) => (
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
                                            (totalCashBreakdown || {})[d.key] ??
                                            0,
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t pt-2">
                                <div className="text-sm text-muted-foreground">
                                    Total
                                </div>
                                <div className="text-lg font-medium">
                                    €
                                    {computeBreakdownTotal(
                                        totalCashBreakdown,
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog
                    open={isVariantModalOpen}
                    onOpenChange={(v) => {
                        if (!v) {
                            setIsVariantModalOpen(false);
                            setPendingVariantAction(null);
                            setPendingVariantContext(null);
                            setSelectedVariantProduct(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogTitle>Select Variant</DialogTitle>
                        <DialogDescription>
                            Please select the options for{' '}
                            {selectedVariantProduct?.name}.
                        </DialogDescription>
                        {selectedVariantProduct && (
                            <VariantSelector
                                product={selectedVariantProduct}
                                onConfirm={handleVariantConfirm}
                                onCancel={() => setIsVariantModalOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
                {/* Sold-out modal shown when server rejects sale due to stock */}
                <Dialog
                    open={isSoldOutModalOpen}
                    onOpenChange={setIsSoldOutModalOpen}
                >
                    <DialogContent>
                        <DialogTitle>Cannot add sale</DialogTitle>
                        <DialogDescription>
                            This item cannot be added because it is sold out.
                        </DialogDescription>
                        <div className="mt-4">{soldOutText}</div>
                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}

const VariantSelector = ({ product, onConfirm, onCancel }: any) => {
    const [selections, setSelections] = React.useState<Record<string, string>>(
        {},
    );

    // Compute available attributes
    const attributes = React.useMemo(() => {
        const attrs: Record<string, Set<string>> = {};
        product.variants?.forEach((v: any) => {
            Object.entries(v.options || {}).forEach(([key, val]: any) => {
                if (!attrs[key]) attrs[key] = new Set();
                attrs[key].add(val);
            });
        });
        return Object.entries(attrs).map(([key, values]) => ({
            key,
            values: Array.from(values).sort(),
        }));
    }, [product]);

    const isComplete = attributes.every((a) => selections[a.key]);

    // Find matching variant
    const matchingVariant = React.useMemo(() => {
        if (!isComplete) return null;
        return product.variants?.find((v: any) => {
            return Object.entries(selections).every(
                ([k, val]) => v.options[k] === val,
            );
        });
    }, [product, selections, isComplete]);

    const handleConfirm = () => {
        if (isComplete) {
            onConfirm(selections);
        }
    };

    return (
        <div className="space-y-4">
            {attributes.map((attr) => (
                <div key={attr.key}>
                    <div className="mb-2 text-sm font-medium">{attr.key}</div>
                    <div className="flex flex-wrap gap-2">
                        {attr.values.map((val: any) => {
                            const isSelected = selections[attr.key] === val;
                            return (
                                <Button
                                    key={val}
                                    variant={isSelected ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() =>
                                        setSelections((prev) => ({
                                            ...prev,
                                            [attr.key]: val,
                                        }))
                                    }
                                >
                                    {val}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {isComplete && !matchingVariant && (
                <div className="text-sm text-red-500">
                    This combination is not available.
                </div>
            )}

            {matchingVariant && (
                <div className="text-sm text-green-600">
                    {matchingVariant.remaining !== null
                        ? `${matchingVariant.remaining} remaining`
                        : 'Available'}
                    {' - '} €
                    {Number(matchingVariant.price || product.price).toFixed(2)}
                </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    disabled={!isComplete || !matchingVariant}
                    onClick={handleConfirm}
                >
                    Confirm
                </Button>
            </div>
        </div>
    );
};
