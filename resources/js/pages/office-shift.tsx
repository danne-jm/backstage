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
import { Check, Eye, HelpCircle, Pencil } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office Shifts',
        href: office().url,
    },
];

const denominationConfig = [
    { key: '50e', label: '€50' }, { key: '20e', label: '€20' }, { key: '10e', label: '€10' }, { key: '5e', label: '€5' },
    { key: '2e', label: '€2' }, { key: '1e', label: '€1' },
    { key: '50c', label: '50¢' }, { key: '20c', label: '20¢' }, { key: '10c', label: '10¢' }, { key: '5c', label: '5¢' }, { key: '2c', label: '2¢' }, { key: '1c', label: '1¢' },
    { key: 'token', label: 'Pink Token' },
];

const mergeBreakdowns = (b1: any, b2: any): Record<string, number> => {
    const merged: Record<string, number> = {};
    denominationConfig.forEach(d => {
        const key = d.key;
        const val1 = Number(b1?.[key] || 0);
        const val2 = Number(b2?.[key] || 0);
        merged[key] = val1 + val2;
    });
    return merged;
};

export default function Office() {
    const props = usePage<SharedData>().props;
    
    const sellables: any[] = Array.isArray(props['sellables'])
        ? props['sellables']
        : [];
    const activeShift: any = props['activeShift'] ?? null;
    const previousTotals: any = props['previousTotals'] ?? {
        cash: 0,
        card: 0,
        combined: 0,
    };

    const isEventInSellWindow = (item: any) => {
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
    };

    const filteredSellables = sellables.filter((s) => isEventInSellWindow(s));

    const [workers, setWorkers] = React.useState<any[]>([]);
    const [sales, setSales] = React.useState<any[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [isPollingPaused, setIsPollingPaused] = React.useState(false);

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

    React.useEffect(() => {
        if (!activeShift || isPollingPaused || activeShift?.status === 'closed') return undefined;

        const interval = setInterval(() => {
            router.get(`/office/${activeShift.id}`, {}, { preserveState: true, preserveScroll: true, replace: true, only: ['activeShift', 'previousTotals', 'staff', 'products'] });
        }, 60000);

        return () => clearInterval(interval);
    }, [activeShift?.id, isPollingPaused, activeShift?.status]);

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

    const [saleProductId, setSaleProductId] = React.useState<number | null>(
        filteredSellables.length ? filteredSellables[0].actual_id : null,
    );
    const [saleItemType, setSaleItemType] = React.useState<'product' | 'event'>(
        filteredSellables.length ? filteredSellables[0].type : 'product',
    );
    const [saleTicketType, setSaleTicketType] = React.useState<
        'with_card' | 'without_card'
    >('with_card');

    React.useEffect(() => {
        if (filteredSellables.length) {
            setSaleProductId(filteredSellables[0].actual_id ?? null);
            setSaleItemType(filteredSellables[0].type ?? 'product');
        } else {
            setSaleProductId(null);
            setSaleItemType('product');
        }
    }, [filteredSellables.length]);

    const [customSaleItemId, setCustomSaleItemId] = React.useState<string>('custom');
    const [customAmount, setCustomAmount] = React.useState('');
    const [customDescription, setCustomDescription] = React.useState('');

    const cashTotal = (sales || []).filter((s: any) => String(s.method).toLowerCase() === 'cash').reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const cardTotal = (sales || []).filter((s: any) => String(s.method).toLowerCase() === 'card').reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const combinedTotal = cashTotal + cardTotal;

    const [startTotals, setStartTotals] = React.useState<{ cash: number; card: number; }>({ cash: Number(activeShift?.start_cash ?? 0), card: Number(activeShift?.start_card ?? 0) });
    const [editingStart, setEditingStart] = React.useState<{ cash: boolean; card: boolean; }>({ cash: false, card: false });
    const [pendingStart, setPendingStart] = React.useState<{ cash: number; card: number; } | null>(null);

    const [startCollapsed, setStartCollapsed] = React.useState<boolean>(false);
    const [activeCollapsed, setActiveCollapsed] = React.useState<boolean>(false);
    const [totalCollapsed, setTotalCollapsed] = React.useState<boolean>(false);

    const revenueRef = React.useRef<HTMLDivElement>(null);
    const [revenueHeight, setRevenueHeight] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (!revenueRef.current) return;
        const updateHeight = () => { if (revenueRef.current) { const height = revenueRef.current.getBoundingClientRect().height; setRevenueHeight(height); } };
        const initialTimer = setTimeout(updateHeight, 0);
        const resizeObserver = new ResizeObserver(() => { requestAnimationFrame(updateHeight); });
        resizeObserver.observe(revenueRef.current);
        return () => { clearTimeout(initialTimer); resizeObserver.disconnect(); };
    }, [startCollapsed, activeCollapsed, totalCollapsed, editingStart.cash, editingStart.card, pendingStart, sales, workers]);

    React.useEffect(() => {
        if (activeShift && !editingStart.cash && !editingStart.card) {
            setStartTotals({ cash: Number(activeShift.start_cash ?? 0), card: Number(activeShift.start_card ?? 0) });
        }
    }, [activeShift?.start_cash, activeShift?.start_card, editingStart.cash, editingStart.card]);

    const defaultCashState = { '50e': 0, '20e': 0, '10e': 0, '5e': 0, '2e': 0, '1e': 0, '50c': 0, '20c': 0, '10c': 0, '5c': 0, '2c': 0, '1c': 0, token: 0 };
    const [isCashModalOpen, setIsCashModalOpen] = React.useState(false);
    const [cashBreakdown, setCashBreakdown] = React.useState<Record<string, number>>(defaultCashState);
    const [isCustomCashModalOpen, setIsCustomCashModalOpen] = React.useState(false);
    const [customCashBreakdown, setCustomCashBreakdown] = React.useState<Record<string, number>>(defaultCashState);
    const [quickSaleContext, setQuickSaleContext] = React.useState<any | null>(null);

    const openCashModalForStart = () => {
        const existing = activeShift?.start_cash_breakdown ?? null;
        const init = { ...defaultCashState };
        if (existing && typeof existing === 'object') {
            for (const k of Object.keys(init)) { init[k] = Number(existing[k] ?? 0); }
        }
        setCashBreakdown(init);
        setIsCashModalOpen(true);
    };

    const computeBreakdownTotal = (b: Record<string, number> | null) => {
        if (!b) return 0;
        const values: Record<string, number> = { '50e': 50, '20e': 20, '10e': 10, '5e': 5, '2e': 2, '1e': 1, '50c': 0.5, '20c': 0.2, '10c': 0.1, '5c': 0.05, '2c': 0.02, '1c': 0.01, token: 0 };
        let t = 0;
        for (const k of Object.keys(values)) { t += (Number(b[k] ?? 0) || 0) * values[k]; }
        return t;
    };

    const [customCashModalTitle, setCustomCashModalTitle] = React.useState('Cash Sale');

    const openCustomCashModal = (context: any | null = null) => {
        setCustomCashBreakdown({ ...defaultCashState });
        if (context) {
            const selectedItem = filteredSellables.find((i: any) => i.actual_id === context.productId);
            if (selectedItem) {
                let price = selectedItem.price;
                if (selectedItem.type === 'event') { price = context.ticketType === 'with_card' ? selectedItem.price_with_card : selectedItem.price_without_card; }
                setCustomCashModalTitle(`Cash Sale: ${selectedItem.name} (€${Number(price).toFixed(2)})`);
            }
        } else {
            setCustomCashModalTitle('Cash breakdown for Custom Sale');
        }
        setQuickSaleContext(context);
        setIsCustomCashModalOpen(true);
    };

    const [isSaleEditOpen, setIsSaleEditOpen] = React.useState(false);
    const [editingSale, setEditingSale] = React.useState<any | null>(null);
    const [saleEditBreakdown, setSaleEditBreakdown] = React.useState<Record<string, number>>(defaultCashState);
    const [isViewingLiveCashBreakdown, setIsViewingLiveCashBreakdown] = React.useState(false);
    const [isViewingTotalCashBreakdown, setIsViewingTotalCashBreakdown] = React.useState(false);
    
    const openSaleEditModal = (sale: any) => {
        setEditingSale(sale);
        const existing = sale?.breakdown;
        if (existing && typeof existing === 'object') {
            const init = { ...defaultCashState };
            for (const k of Object.keys(init)) { init[k] = Number(existing[k] ?? 0); }
            setSaleEditBreakdown(init);
            setIsSaleEditOpen(true);
            return;
        }
        const amt = Number(sale?.amount ?? 0) || 0;
        const denominations: Array<{ key: string; value: number }> = [ { key: '50e', value: 50 }, { key: '20e', value: 20 }, { key: '10e', value: 10 }, { key: '5e', value: 5 }, { key: '2e', value: 2 }, { key: '1e', value: 1 }, { key: '50c', value: 0.5 }, { key: '20c', value: 0.2 }, { key: '10c', value: 0.1 }, { key: 'token', value: 0 }];
        let remaining = Math.round(amt * 100) / 100;
        const derived = { ...defaultCashState };
        for (const d of denominations) {
            if (d.value === 0) continue;
            const count = Math.floor(remaining / d.value);
            if (count > 0) { derived[d.key] = count; remaining = Math.round((remaining - count * d.value) * 100) / 100; }
        }
        setSaleEditBreakdown(derived);
        setIsSaleEditOpen(true);
    };

    const totalCash = Number(startTotals.cash ?? 0) + cashTotal;
    const totalCard = Number(startTotals.card ?? 0) + cardTotal;
    const totalCombined = totalCash + totalCard;

    const totalCashBreakdown = React.useMemo(() => {
        return mergeBreakdowns(activeShift?.start_cash_breakdown, activeShift?.cash_breakdown);
    }, [activeShift?.start_cash_breakdown, activeShift?.cash_breakdown]);

    const dayOrdinal = (n: number) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return `${n}th`;
        switch (n % 10) { case 1: return `${n}st`; case 2: return `${n}nd`; case 3: return `${n}rd`; default: return `${n}th`; }
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

    const summarizeSales = (sales?: any[]) => {
        if (!Array.isArray(sales) || sales.length === 0) return '';
        const normalizeName = (sale: any) => { const raw = String(sale?.name ?? 'Unknown').trim(); return raw.replace(/\s*\(.*\)$/, '').trim(); };
        const groups: Record<string, { name: string; count: number; isEvent: boolean }> = {};
        for (const s of sales) {
            const base = normalizeName(s);
            const isEvent = Boolean(s?.item_type === 'event' || s?.ticket_type || s?.ticket_label);
            if (!groups[base]) groups[base] = { name: base, count: 0, isEvent };
            groups[base].count += 1;
            if (isEvent) groups[base].isEvent = true;
        }
        const grouped = Object.values(groups);
        grouped.sort((a, b) => { const diff = a.count - b.count; if (diff !== 0) return diff; return a.name.localeCompare(b.name); });
        return grouped.map((g) => `${g.name} ${g.count}`).join(' | ');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office Shifts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {message && (<div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform"><Alert><Check /><AlertTitle>{message}</AlertTitle></Alert></div>)}

                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border" style={{ height: revenueHeight ? `${revenueHeight}px` : 'auto', minHeight: revenueHeight ? `${revenueHeight}px` : 'auto' }}>
                        <h3 className="text-sm font-semibold">Workers</h3>
                        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                            <ul className="space-y-2">
                                {staffData.map((member: any) => (
                                    <li key={member.id} className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                                        <div><div className="text-sm font-medium">{member.name}</div><div className="text-xs text-muted-foreground">{member.role}</div></div>
                                        <div className="flex items-center gap-2">
                                            {!member.onShift ? (
                                                <Button size="sm" variant="ghost" disabled={!activeShift || submitting || activeShift?.status === 'closed'} onClick={() => { if (!activeShift) return; setWorkers((prev) => [{ id: member.id, name: member.name, role: member.role, email: member.email }, ...(prev || [])]); router.post(`/office/${activeShift.id}/add-worker`, { user_id: member.id }, { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onSuccess: () => setMessage('Worker added'), onError: () => { setWorkers((prev) => (prev || []).filter((w: any) => w.id !== member.id)); setMessage('Failed to add worker'); } }); }}>Add</Button>
                                            ) : (
                                                <><Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-muted/30" disabled={submitting || activeShift?.status === 'closed'} onClick={() => { if (!activeShift) return; setWorkers((prev) => (prev || []).filter((w: any) => w.id !== member.id)); router.post(`/office/${activeShift.id}/remove-worker`, { user_id: member.id }, { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onSuccess: () => setMessage('Worker removed'), onError: () => { setWorkers((prev) => [{ id: member.id, name: member.name, role: member.role, email: member.email }, ...(prev || [])]); setMessage('Failed to remove worker'); } }); }}>Remove</Button><div className="text-sm text-neutral-600">On shift</div></>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    <section ref={revenueRef} className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="text-sm font-semibold">Revenue</h3>
                        <div className="mt-4 space-y-3">
                            <div>
                                <div className="flex items-center justify-between"><div className="text-xs font-medium">Start of shift</div><Button size="sm" variant="ghost" onClick={() => setStartCollapsed((s) => !s)}>{startCollapsed ? 'Show' : 'Hide'}</Button></div>
                                <Dialog open={isCustomCashModalOpen} onOpenChange={(v) => { setIsCustomCashModalOpen(v); if (!v) setQuickSaleContext(null); setIsPollingPaused(v); }}>
                                    <DialogContent>
                                        <DialogTitle>{customCashModalTitle}</DialogTitle>
                                        <DialogDescription>Provide the counts of bills, coins and tokens.</DialogDescription>
                                        <div className="mt-4 grid grid-cols-1 gap-3">
                                            {denominationConfig.map((d) => (
                                                <div key={d.key} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div></div>
                                                    <div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => setCustomCashBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, (prev[d.key] || 0) - 1) }))}>-</Button><input type="number" min={0} value={String(customCashBreakdown[d.key] ?? 0)} onChange={(e) => setCustomCashBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, Math.floor(Number(e.target.value || 0))) }))} className="w-20 rounded-md border p-1 text-right" /><Button size="sm" onClick={() => setCustomCashBreakdown((prev) => ({ ...prev, [d.key]: (prev[d.key] || 0) + 1 }))}>+</Button></div>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between border-t pt-2"><div className="text-sm text-muted-foreground">Calculated total</div><div className="text-lg font-medium">€{computeBreakdownTotal(customCashBreakdown).toFixed(2)}</div></div>
                                            <div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose><Button onClick={() => { if (!activeShift) return; setSubmitting(true); const computed = Number(computeBreakdownTotal(customCashBreakdown).toFixed(2)); const isQuick = Boolean(quickSaleContext); let amountToUse = 0; let selectedItem = null; let itemName = 'Custom Sale'; let productIdToSend = null; let itemTypeToSend = 'custom'; let descToUse = String(customDescription || ''); let ticketTypeToSend = undefined; let ticketLabelToSend = undefined; if (isQuick) { selectedItem = filteredSellables.find((i: any) => i.actual_id === quickSaleContext.productId); productIdToSend = quickSaleContext.productId; itemTypeToSend = quickSaleContext.itemType; ticketTypeToSend = quickSaleContext.ticketType; ticketLabelToSend = quickSaleContext.ticketLabel; if (computed > 0) amountToUse = computed; else if (selectedItem) { if (selectedItem.type === 'product') amountToUse = Number(selectedItem.price || 0); else amountToUse = Number(quickSaleContext.ticketType === 'with_card' ? selectedItem.price_with_card : selectedItem.price_without_card) || 0; } itemName = selectedItem ? selectedItem.name : 'Quick Sale'; descToUse = ''; } else { amountToUse = computed > 0 ? computed : Number(customAmount || 0); const isCustom = customSaleItemId === 'custom'; selectedItem = isCustom ? null : filteredSellables.find((i: any) => i.id === customSaleItemId); productIdToSend = selectedItem ? selectedItem.actual_id : null; itemTypeToSend = selectedItem ? selectedItem.type : 'custom'; itemName = selectedItem ? selectedItem.name : 'Custom Sale'; } const tempId = `tmp-${Date.now()}`; const tempSale: any = { id: tempId, name: itemName, method: 'cash', amount: Number(amountToUse), description: descToUse }; setSales((prev) => [tempSale, ...(prev || [])]); router.post(`/office/${activeShift?.id}/record-sale`, { product_id: productIdToSend, item_type: itemTypeToSend, method: 'cash', amount: amountToUse, description: descToUse, ticket_type: ticketTypeToSend, ticket_label: ticketLabelToSend, breakdown: customCashBreakdown }, { onSuccess: () => { setMessage('Sale recorded (Cash)'); setIsCustomCashModalOpen(false); setCustomSaleItemId('custom'); setCustomAmount(''); setCustomDescription(''); }, onError: () => { setSales((prev) => (prev || []).filter((s: any) => s.id !== tempId)); setMessage('Failed to record sale'); }, onFinish: () => { setSubmitting(false); setQuickSaleContext(null); } }); }}>Save</Button></div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                {!startCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Cash</div><div className="flex items-center gap-2">{editingStart.cash ? (<><Input type="number" step="0.01" className="w-32" value={String(pendingStart?.cash ?? startTotals.cash)} onChange={(e) => setPendingStart((prev) => ({ ...(prev ?? startTotals), cash: Number(e.target.value || 0) }))} /><Button size="sm" onClick={() => { if (!activeShift) return; setSubmitting(true); const newCash = pendingStart?.cash ?? startTotals.cash; router.post(`/office/${activeShift.id}/update-start-totals`, { cash: newCash, card: startTotals.card }, { onSuccess: () => { setStartTotals((s) => ({ ...s, cash: newCash })); setMessage('Start cash updated'); setEditingStart((e) => ({ ...e, cash: false })); setPendingStart(null); }, onError: () => setMessage('Failed to update start cash'), onFinish: () => setSubmitting(false) }); }}>Save</Button><Button size="sm" variant="ghost" onClick={() => { setEditingStart((e) => ({ ...e, cash: false })); setPendingStart(null); }}>Cancel</Button></>) : (<><div className="text-lg font-medium">€{Number(startTotals.cash).toFixed(2)}</div><Button size="sm" variant="ghost" disabled={activeShift?.status === 'closed'} onClick={() => openCashModalForStart()}><Pencil className="h-4 w-4" /></Button></>)}</div></div>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Card</div><div className="flex items-center gap-2">{editingStart.card ? (<><Input type="number" step="0.01" className="w-32" value={String(pendingStart?.card ?? startTotals.card)} onChange={(e) => setPendingStart((prev) => ({ ...(prev ?? startTotals), card: Number(e.target.value || 0) }))} /><Button size="sm" onClick={() => { if (!activeShift) return; setSubmitting(true); const newCard = pendingStart?.card ?? startTotals.card; router.post(`/office/${activeShift.id}/update-start-totals`, { cash: startTotals.cash, card: newCard }, { onSuccess: () => { setStartTotals((s) => ({ ...s, card: newCard })); setMessage('Start card updated'); setEditingStart((e) => ({ ...e, card: false })); setPendingStart(null); }, onError: () => setMessage('Failed to update start card'), onFinish: () => setSubmitting(false) }); }}>Save</Button><Button size="sm" variant="ghost" onClick={() => { setEditingStart((e) => ({ ...e, card: false })); setPendingStart(null); }}>Cancel</Button></>) : (<><div className="text-lg font-medium">€{Number(startTotals.card).toFixed(2)}</div><Button size="sm" variant="ghost" disabled={activeShift?.status === 'closed'} onClick={() => setEditingStart((e) => ({ ...e, card: true }))}><Pencil className="h-4 w-4" /></Button></>)}</div></div>
                                        <Dialog open={isCashModalOpen} onOpenChange={(v) => { setIsCashModalOpen(v); setIsPollingPaused(v); }}>
                                            <DialogContent>
                                                <DialogTitle>Cash breakdown</DialogTitle><DialogDescription>Enter counts for each denomination.</DialogDescription>
                                                <div className="mt-4 grid grid-cols-1 gap-3">
                                                    {denominationConfig.map((d) => (<div key={d.key} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div><div className="text-sm text-muted-foreground">{d.label === 'Pink Token' ? 'jeton' : ''}</div></div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => setCashBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, (prev[d.key] || 0) - 1) }))}>-</Button><input type="number" min={0} value={String(cashBreakdown[d.key] ?? 0)} onChange={(e) => setCashBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, Math.floor(Number(e.target.value || 0))) }))} className="w-20 rounded-md border p-1 text-right" /><Button size="sm" onClick={() => setCashBreakdown((prev) => ({ ...prev, [d.key]: (prev[d.key] || 0) + 1 }))}>+</Button></div></div>))}
                                                    <div className="flex items-center justify-between border-t pt-2"><div className="text-sm text-muted-foreground">Calculated total</div><div className="text-lg font-medium">€{computeBreakdownTotal(cashBreakdown).toFixed(2)}</div></div>
                                                    <div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose><Button onClick={() => { if (!activeShift) return; setSubmitting(true); router.post(`/office/${activeShift.id}/update-cash-breakdown`, { target: 'start', breakdown: cashBreakdown }, { onSuccess: () => { setStartTotals((s) => ({ ...s, cash: Number(computeBreakdownTotal(cashBreakdown).toFixed(2)) })); setMessage('Start cash breakdown saved'); setIsCashModalOpen(false); }, onError: () => setMessage('Failed to save breakdown'), onFinish: () => setSubmitting(false) }); }}>Save</Button></div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Combined</div><div className="text-lg font-semibold">€{(Number(startTotals.cash) + Number(startTotals.card)).toFixed(2)}</div></div>
                                    </div>
                                )}
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between"><div className="text-xs font-medium">Active office shift</div><Button size="sm" variant="ghost" onClick={() => setActiveCollapsed((s) => !s)}>{activeCollapsed ? 'Show' : 'Hide'}</Button></div>
                                {!activeCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-1 text-sm text-muted-foreground"><span>Live Cash</span><Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsViewingLiveCashBreakdown(true)}><Eye className="h-4 w-4" /></Button></div><div className="text-lg font-medium">€{cashTotal.toFixed(2)}</div></div>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Live Card</div><div className="text-lg font-medium">€{cardTotal.toFixed(2)}</div></div>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Combined</div><div className="text-xl font-semibold">€{combinedTotal.toFixed(2)}</div></div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-3 border-t pt-3">
                                <div className="flex items-center justify-between"><div className="text-xs font-medium">Total money (start + live)</div><Button size="sm" variant="ghost" onClick={() => setTotalCollapsed((s) => !s)}>{totalCollapsed ? 'Show' : 'Hide'}</Button></div>
                                {!totalCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between"><div className="flex items-center gap-1 text-sm text-muted-foreground"><span>Cash</span><Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsViewingTotalCashBreakdown(true)}><Eye className="h-4 w-4" /></Button></div><div className="text-lg font-medium">€{totalCash.toFixed(2)}</div></div>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Card</div><div className="text-lg font-medium">€{totalCard.toFixed(2)}</div></div>
                                        <div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Combined</div><div className="text-xl font-semibold">€{totalCombined.toFixed(2)}</div></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border" style={{ height: revenueHeight ? `${revenueHeight}px` : 'auto', minHeight: revenueHeight ? `${revenueHeight}px` : 'auto' }}>
                         <h3 className="text-sm font-semibold">{formatShiftTitle(activeShift?.started_at)}</h3>
                         <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                             <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1" disabled={Boolean(activeShift)} onClick={() => { router.post('/office/start', {}, { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onSuccess: () => { setMessage('Shift started'); setTimeout(() => router.reload(), 600); }, onError: () => setMessage('Failed to start shift') }); }}>Start shift</Button>
                                {activeShift?.status === 'open' ? (
                                    <Dialog><DialogTrigger asChild><Button variant="outline" className="flex-1">End shift</Button></DialogTrigger><DialogContent><DialogTitle>End shift?</DialogTitle><DialogDescription>Confirm close.</DialogDescription><DialogFooter className="gap-2"><DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose><DialogClose asChild><Button variant="destructive" onClick={() => router.post(`/office/${activeShift?.id}/end`, {}, { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onSuccess: () => { setMessage('Shift ended'); setTimeout(() => router.reload(), 600); } })}>End shift</Button></DialogClose></DialogFooter></DialogContent></Dialog>
                                ) : (
                                    <Dialog><DialogTrigger asChild><Button variant="outline" className="flex-1" disabled={!activeShift || activeShift?.status !== 'closed'}>Reopen shift</Button></DialogTrigger><DialogContent><DialogTitle>Reopen?</DialogTitle><DialogDescription>Confirm reopen.</DialogDescription><DialogFooter className="gap-2"><DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose><DialogClose asChild><Button disabled={!activeShift || activeShift?.status !== 'closed'} onClick={() => router.post(`/office/${activeShift?.id}/reopen`, {}, { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false), onSuccess: () => { setMessage('Shift reopened'); setTimeout(() => router.reload(), 600); } })}>Reopen shift</Button></DialogClose></DialogFooter></DialogContent></Dialog>
                                )}
                             </div>
                            <div className="mt-2 border-t pt-2"><div className="flex items-center justify-between"><h4 className="text-xs font-medium">Quick add sale</h4><Link href="/sellables"><Button size="sm" variant="ghost">Manage</Button></Link></div>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select value={String(saleProductId ?? '')} onChange={(e) => { const id = Number(e.target.value) || null; setSaleProductId(id); const item = filteredSellables.find((i: any) => i.actual_id === id); if (item) setSaleItemType(item.type); }} className="w-full rounded-md border p-2" disabled={activeShift?.status !== 'open'}>
                                        {filteredSellables.map((item: any) => { const label = item.type === 'product' ? `${item.name} — €${Number(item.price).toFixed(2)}` : `${item.name} — Event`; return (<option key={item.id} value={item.actual_id}>{label}</option>); })}
                                    </select>
                                </div>
                                {saleItemType === 'event' && saleProductId && filteredSellables.find((i: any) => i.actual_id === saleProductId) && (
                                    <div className="mt-2 space-y-2">
                                        <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="ticket-type" value="with_card" checked={saleTicketType === 'with_card'} onChange={() => setSaleTicketType('with_card')} className="h-4 w-4" /><span className="text-sm">With ESN Card — €{Number(filteredSellables.find((i: any) => i.actual_id === saleProductId)?.price_with_card).toFixed(2)}</span></label>
                                        <label className="flex cursor-pointer items-center gap-2"><input type="radio" name="ticket-type" value="without_card" checked={saleTicketType === 'without_card'} onChange={() => setSaleTicketType('without_card')} className="h-4 w-4" /><span className="text-sm">Without ESN Card — €{Number(filteredSellables.find((i: any) => i.actual_id === saleProductId)?.price_without_card).toFixed(2)}</span></label>
                                    </div>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                    <Button disabled={activeShift?.status !== 'open'} onClick={() => { if (!saleProductId || !activeShift) return; const selectedItem = filteredSellables.find((i: any) => i.actual_id === saleProductId); if (!selectedItem) return; openCustomCashModal({ productId: saleProductId, itemType: selectedItem.type, ticketType: saleTicketType, ticketLabel: selectedItem.type === 'event' ? (saleTicketType === 'with_card' ? 'With ESN Card' : 'Without ESN Card') : undefined }); }}>Add Cash</Button>
                                    <Button disabled={activeShift?.status !== 'open'} onClick={() => { if (!saleProductId || !activeShift) return; const selectedItem = filteredSellables.find((i: any) => i.actual_id === saleProductId); if (!selectedItem) return; let amountToUse = '0'; let itemName = selectedItem.name; if (selectedItem.type === 'product') { amountToUse = String(selectedItem.price); } else { amountToUse = saleTicketType === 'with_card' ? String(selectedItem.price_with_card) : String(selectedItem.price_without_card); itemName += ` (${saleTicketType === 'with_card' ? 'with' : 'without'} ESN card)`; } const ticketLabel = selectedItem.type === 'event' ? (saleTicketType === 'with_card' ? 'With ESN Card' : 'Without ESN Card') : ''; const tempId = `tmp-${Date.now()}`; const tempSale: any = { id: tempId, name: itemName, method: 'card', amount: Number(amountToUse), description: '', ticket_type: selectedItem.type === 'event' ? saleTicketType : undefined, ticket_label: ticketLabel || undefined }; setSales((prev) => [tempSale, ...(prev || [])]); setSubmitting(true); router.post(`/office/${activeShift?.id}/record-sale`, { product_id: saleProductId, item_type: selectedItem.type, method: 'card', amount: amountToUse, ticket_type: selectedItem.type === 'event' ? saleTicketType : undefined, ticket_label: ticketLabel || undefined }, { onSuccess: () => setMessage('Sale recorded (Card)'), onError: () => { setSales((prev) => (prev || []).filter((s: any) => s.id !== tempId)); setMessage('Failed to record sale'); }, onFinish: () => setSubmitting(false) }); }}>Add Card</Button>
                                    <div className="flex-1" />
                                </div>
                            </div>
                            
                            <div className="mt-2 border-t pt-2">
                                <h4 className="text-xs font-medium">Custom sale</h4>
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <select value={customSaleItemId} onChange={(e) => setCustomSaleItemId(e.target.value)} className="rounded-md border p-2" disabled={activeShift?.status !== 'open'}><option value="custom">Custom</option>{filteredSellables.map((item: any) => { const label = item.type === 'product' ? `${item.name} — €${Number(item.price).toFixed(2)}` : `${item.name} — Event`; return (<option key={item.id} value={item.actual_id}>{label}</option>); })}</select>
                                    <div className="flex items-center gap-2"><Input type="number" step="0.01" min="0" placeholder="€0.00" value={customAmount} onChange={(e) => { const value = e.target.value; if (value === '' || /^\d*\.?\d*$/.test(value)) setCustomAmount(value); }} disabled={activeShift?.status !== 'open'} /></div>
                                    <Input placeholder="Description (mandatory)" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} disabled={activeShift?.status !== 'open'} />
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Button disabled={!activeShift || !customDescription || activeShift?.status !== 'open'} onClick={() => { if (!activeShift || !customDescription) return; openCustomCashModal(null); }}>Add Cash</Button>
                                    <Button disabled={!activeShift || !customAmount || !customDescription || activeShift?.status !== 'open'} onClick={() => { if (!activeShift || !customAmount || !customDescription) return; const isCustom = customSaleItemId === 'custom'; const selectedItem = isCustom ? null : filteredSellables.find((i: any) => i.id === customSaleItemId); const amountToUse = String(customAmount); const descToUse = String(customDescription || ''); const itemName = selectedItem ? selectedItem.name : 'Custom Sale'; const tempId = `tmp-${Date.now()}`; const tempSale: any = { id: tempId, name: itemName, method: 'card', amount: Number(amountToUse), description: descToUse }; setSales((prev) => [tempSale, ...(prev || [])]); setSubmitting(true); router.post(`/office/${activeShift?.id}/record-sale`, { product_id: selectedItem ? selectedItem.actual_id : null, item_type: selectedItem ? selectedItem.type : 'custom', method: 'card', amount: amountToUse, description: descToUse }, { onSuccess: () => { setMessage('Custom sale recorded (Card)'); setCustomSaleItemId('custom'); setCustomAmount(''); setCustomDescription(''); }, onError: () => { setSales((prev) => (prev || []).filter((s: any) => s.id !== tempId)); setMessage('Failed to record custom sale'); }, onFinish: () => setSubmitting(false) }); }}>Add Card</Button>
                                </div>
                            </div>
                         </div>
                    </section>
                </div>
                
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                     <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-semibold">Sales log</h3><div className="text-xs text-muted-foreground">{Array.isArray(sales) ? `${sales.length} sales${sales.length ? ' | ' + summarizeSales(sales) : ''}` : ''}</div></div>
                     <div className="overflow-x-auto">
                        <div className="max-h-[36rem] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                        <th className="w-[25%] px-1">Item</th>
                                        <th className="w-[10%] px-1">Method</th>
                                        <th className="w-[15%] px-1">Amount</th>
                                        <th className="w-[20%] px-1">Description</th>
                                        <th className="w-[15%] px-1">Sold by</th>
                                        <th className="w-[15%] px-1">Sold at</th>
                                        <th className="sr-only">Actions</th> {/* Hidden column for alignment */}
                                    </tr>
                                </thead>
                                <tbody className="mt-2">
                                    {(sales || []).slice(0, 12).map((s: any) => (
                                        <tr key={String(s.id)} className="border-t">
                                            <td className="py-3 px-1">
                                                <span className="block max-w-[100%] truncate" title={s.name ?? s.item ?? 'N/A'}>
                                                    {s.name ?? s.item ?? 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="block max-w-[100%] truncate" title={String(s.method)}>
                                                    {s.method}
                                                </span>
                                            </td>
                                            <td className="py-3 px-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="block max-w-[100%] truncate" title={`€${Number(s.amount ?? 0).toFixed(2)}`}>
                                                        €{Number(s.amount ?? 0).toFixed(2)}
                                                    </span>
                                                    {String(s.method).toLowerCase() === 'cash' && (
                                                        <>
                                                            <Button size="icon" variant="ghost" className="h-4 w-4" onClick={() => activeShift?.status === 'open' && openSaleEditModal(s)} aria-label="Edit cash sale" disabled={activeShift?.status !== 'open'}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="block max-w-[100%] truncate" title={s.description ?? s.buyer ?? ''}>
                                                    {s.description ?? s.buyer ?? ''}
                                                </span>
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="block max-w-[100%] truncate" title={s.sold_by ?? s.sold_by_email ?? s.sold_by_id ?? 'Unknown'}>
                                                    {s.sold_by ?? s.sold_by_email ?? s.sold_by_id ?? 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-1">
                                                <span className="block max-w-[100%] truncate" title={(s.sold_at ?? s.created_at) ? new Date(s.sold_at ?? s.created_at).toLocaleString() : 'N/A'}>
                                                    {(s.sold_at ?? s.created_at) ? new Date(s.sold_at ?? s.created_at).toLocaleString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-1">
                                                <Button size="sm" variant="ghost" disabled={submitting || activeShift?.status !== 'open'} onClick={() => { if (!activeShift || submitting) return; const saleId = s.id; setSales((prev) => (prev || []).filter((x: any) => x.id !== saleId)); setSubmitting(true); router.post(`/office/${activeShift?.id}/remove-sale`, { sale_id: saleId }, { preserveScroll: true, onSuccess: () => setMessage('Sale removed'), onError: () => { setSales((prev) => [s, ...(prev || [])]); setMessage('Failed to remove sale'); }, onFinish: () => setSubmitting(false) }); }}>Remove</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                     <Dialog open={isSaleEditOpen} onOpenChange={(v) => { setIsSaleEditOpen(v); if (!v) setEditingSale(null); setIsPollingPaused(v); }}>
                         <DialogContent>
                             <DialogTitle>Edit cash transaction</DialogTitle><DialogDescription>Adjust cash denominations.</DialogDescription>
                             <div className="mt-4 grid grid-cols-1 gap-3">
                                 {denominationConfig.map((d) => (
                                     <div key={d.key} className="flex items-center justify-between">
                                         <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div><div className="text-sm text-muted-foreground">{d.label === 'Pink Token' ? 'jeton' : ''}</div></div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" onClick={() => setSaleEditBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, (prev[d.key] || 0) - 1) }))}>-</Button><input type="number" min={0} value={String(saleEditBreakdown[d.key] ?? 0)} onChange={(e) => setSaleEditBreakdown((prev) => ({ ...prev, [d.key]: Math.max(0, Math.floor(Number(e.target.value || 0))) }))} className="w-20 rounded-md border p-1 text-right" /><Button size="sm" onClick={() => setSaleEditBreakdown((prev) => ({ ...prev, [d.key]: (prev[d.key] || 0) + 1 }))}>+</Button></div></div>))}
                                                    <div className="flex items-center justify-between border-t pt-2"><div className="text-sm text-muted-foreground">Calculated total</div><div className="text-lg font-medium">€{computeBreakdownTotal(saleEditBreakdown).toFixed(2)}</div></div>
                                 <div className="flex justify-end gap-2"><DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose><Button onClick={() => { if (!activeShift || !editingSale) return; setSubmitting(true); const computed = Number(computeBreakdownTotal(saleEditBreakdown).toFixed(2)); const amountToUse = computed > 0 ? computed : Number(editingSale.amount || 0); setSales((prev) => (prev || []).map((x: any) => x.id === editingSale.id ? { ...x, amount: amountToUse } : x)); router.post(`/office/${activeShift.id}/update-sale`, { sale_id: editingSale.id, amount: amountToUse, breakdown: saleEditBreakdown }, { onSuccess: () => { setMessage('Sale updated'); setIsSaleEditOpen(false); }, onError: () => { router.get(`/office/${activeShift.id}`, {}, { preserveState: true, only: ['activeShift'] }); setMessage('Failed to update sale'); }, onFinish: () => setSubmitting(false) }); }}>Save</Button></div>
                             </div>
                         </DialogContent>
                     </Dialog>
                     <div className="mt-6 flex justify-end gap-4">
                        <div className="text-sm"><div className="flex items-center gap-2 text-muted-foreground"><span>Cash</span><Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsViewingLiveCashBreakdown(true)}><HelpCircle className="h-4 w-4" /></Button></div><div className="font-medium">€{cashTotal.toFixed(2)}</div></div>
                        <div className="text-sm"><div className="text-muted-foreground">Card</div><div className="font-medium">€{cardTotal.toFixed(2)}</div></div>
                        <div className="text-sm"><div className="text-muted-foreground">Total</div><div className="font-semibold">€{combinedTotal.toFixed(2)}</div></div>
                     </div>
                </div>

                <Dialog open={isViewingLiveCashBreakdown} onOpenChange={setIsViewingLiveCashBreakdown}>
                    <DialogContent>
                        <DialogTitle>Live Cash Sales Breakdown</DialogTitle>
                        <DialogDescription>Read-only breakdown of cash sales made during this shift.</DialogDescription>
                        <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                            {denominationConfig.map((d) => (
                                <div key={d.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div>
                                        <div className="text-sm font-medium">{Number((activeShift?.cash_breakdown || {})[d.key] ?? 0)}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t pt-2">
                                <div className="text-sm text-muted-foreground">Total</div>
                                <div className="text-lg font-medium">€{computeBreakdownTotal(activeShift?.cash_breakdown || {}).toFixed(2)}</div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={isViewingTotalCashBreakdown} onOpenChange={setIsViewingTotalCashBreakdown}>
                    <DialogContent>
                        <DialogTitle>Total Cash Drawer Breakdown</DialogTitle>
                        <DialogDescription>Read-only breakdown of all cash currently in the drawer (start of shift + live sales).</DialogDescription>
                        <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                            {denominationConfig.map((d) => (
                                <div key={d.key} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div>
                                        <div className="text-sm font-medium">{Number((totalCashBreakdown || {})[d.key] ?? 0)}</div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center justify-between border-t pt-2">
                                <div className="text-sm text-muted-foreground">Total</div>
                                <div className="text-lg font-medium">€{computeBreakdownTotal(totalCashBreakdown).toFixed(2)}</div>
                            </div>
                        </div>
                        <DialogFooter>
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