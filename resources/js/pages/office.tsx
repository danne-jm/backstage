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
import { Check, Eye, Pencil } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office',
        href: office().url,
    },
];

const denominationConfig = [
    { key: '50e', label: '€50' }, { key: '20e', label: '€20' }, { key: '10e', label: '€10' }, { key: '5e', label: '€5' },
    { key: '2e', label: '€2' }, { key: '1e', label: '€1' },
    { key: '50c', label: '50¢' }, { key: '20c', label: '20¢' }, { key: '10c', label: '10¢' }, { key: '5c', label: '5¢' }, { key: '2c', label: '2¢' }, { key: '1c', label: '1¢' },
    { key: 'token', label: 'Pink Token' },
];

export default function Office() {
    const props = usePage<SharedData>().props;

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const products: any[] = Array.isArray(props['products']) ? props['products'] : [];
    const sellables: any[] = Array.isArray(props['sellables']) ? props['sellables'] : [];
    const pastShifts: any[] = Array.isArray(props['pastShifts']) ? props['pastShifts'] : [];
    const staff: any[] = Array.isArray(props['staff']) ? props['staff'] : [];
    const now = new Date();

    const staffMap = React.useMemo(() => 
        new Map(staff.map(s => [s.email, s.name])),
    [staff]);
    
    const productItems = (products || []).slice().sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0));

    const eventItemsRaw = (sellables || []).filter((s: any) => s.type === 'event');
    const eventItems = eventItemsRaw.filter((e: any) => {
        if (!e.end_sell_date) return true;
        const end = new Date(e.end_sell_date);
        if (isNaN(end.getTime())) return true;
        return end.getTime() >= now.getTime();
    });

    const activeEvents = eventItems.filter((e: any) => {
        const start = e.start_sell_date ? new Date(e.start_sell_date) : null;
        const end = e.end_sell_date ? new Date(e.end_sell_date) : null;
        if (start && now.getTime() < start.getTime()) return false;
        if (end && now.getTime() > end.getTime()) return false;
        return true;
    }).sort((a: any, b: any) => new Date(a.end_sell_date).getTime() - new Date(b.end_sell_date).getTime());

    const upcomingEvents = eventItems.filter((e: any) => {
        if (!e.start_sell_date) return false;
        const start = new Date(e.start_sell_date);
        return !isNaN(start.getTime()) && start.getTime() > now.getTime();
    }).sort((a: any, b: any) => new Date(a.start_sell_date).getTime() - new Date(b.start_sell_date).getTime());

    const orderedSellables = [...productItems.map((p: any) => ({ ...p, type: 'product', id: `product_${p.id}` })), ...activeEvents, ...upcomingEvents];

    const daysRemaining = (iso?: string | null) => {
        if (!iso) return 0;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 0;
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.ceil((d.getTime() - now.getTime()) / msPerDay);
    };

    const sellPeriodMessage = (startIso?: string | null, endIso?: string | null) => {
        const start = startIso ? new Date(startIso) : null;
        const end = endIso ? new Date(endIso) : null;
        if (!start && !end) return 'Always available';

        if (start && now.getTime() < start.getTime()) {
            const days = daysRemaining(startIso);
            return `Starts in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        if (end && now.getTime() > end.getTime()) {
            return 'Sale ended';
        }
        if(end && now.getTime() <= end.getTime()) {
            const days = daysRemaining(endIso);
            return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        return 'Available';
    };

    const [message, setMessage] = React.useState('');
    const [isPollingPaused, setIsPollingPaused] = React.useState(false);
    const [viewingSale, setViewingSale] = React.useState<any | null>(null);
    const [isViewingStartBreakdown, setIsViewingStartBreakdown] = React.useState(false);
    const [isViewingEndBreakdown, setIsViewingEndBreakdown] = React.useState(false);
    const [isViewingSalesBreakdown, setIsViewingSalesBreakdown] = React.useState(false);

    const computeBreakdownTotal = (bd?: Record<string, number> | null): number => {
        if (!bd) return 0;
        const map: Record<string, number> = {
            '500e': 500, '200e': 200, '100e': 100, '50e': 50, '20e': 20, '10e': 10, '5e': 5, '2e': 2, '1e': 1,
            '50c': 0.50, '20c': 0.20, '10c': 0.10, '5c': 0.05, '2c': 0.02, '1c': 0.01, 'token': 0.0,
        };
        return Object.keys(bd).reduce((sum: number, k: string) => sum + Number(bd[k] || 0) * (map[k] ?? 0), 0);
    };

    const lastShiftRef = React.useRef<HTMLDivElement>(null);
    const [lastShiftHeight, setLastShiftHeight] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    React.useEffect(() => {
        if (!lastShiftRef.current) return;
        const updateHeight = () => {
            if (lastShiftRef.current) {
                const height = lastShiftRef.current.getBoundingClientRect().height;
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
        return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const summarizeSales = (sales?: any[]) => {
        if (!Array.isArray(sales) || sales.length === 0) return '';
        const normalizeName = (sale: any) => String(sale?.name ?? 'Unknown').trim().replace(/\s*\(.*\)$/, '').trim();
        const groups: Record<string, { name: string; count: number; isEvent: boolean }> = {};
        for (const s of sales) {
            const base = normalizeName(s);
            const isEvent = Boolean(s?.item_type === 'event' || s?.ticket_type || s?.ticket_label);
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

    React.useEffect(() => {
        if (isPollingPaused) return undefined;
        const interval = setInterval(() => {
            router.get(office().url, {}, { preserveState: true, preserveScroll: true, replace: true, only: ['activeShift', 'lastShift', 'products', 'sellables', 'pastShifts', 'staff'] });
        }, 2000);
        return () => clearInterval(interval);
    }, [isPollingPaused]);

    const filteredPastShifts = (pastShifts || []).filter((s: any) => s.id !== lastShift?.id && s.id !== activeShift?.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3 md:items-start">
                    <section ref={lastShiftRef} className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Last Office Shift</h3>
                            {lastShift ? (<Link href={`/office/${lastShift.id}`}><Button size="sm" variant="ghost">Review</Button></Link>) : null}
                        </div>
                        {lastShift ? (
                            <div className="space-y-3">
                                <div><div className="text-xs text-muted-foreground">Started</div><div className="text-sm font-medium">{formatTimestamp(lastShift.started_at)}</div></div>
                                <div><div className="text-xs text-muted-foreground">Ended</div><div className="text-sm font-medium">{formatTimestamp(lastShift.ended_at)}</div></div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Workers</div>
                                    <div className="text-sm">{Array.isArray(lastShift.workers) && lastShift.workers.length > 0 ? lastShift.workers.map((w: any) => w.name).join(', ') : 'None'}</div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">Start Money</div>
                                    <div className="mt-1 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1">
                                            <span>Cash:</span>
                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsViewingStartBreakdown(true)}><Eye className="h-4 w-4" /></Button>
                                        </div>
                                        <span className="font-medium">€{Number(lastShift.start_cash ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm"><span>Card:</span><span className="font-medium">€{Number(lastShift.start_card ?? 0).toFixed(2)}</span></div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">End of Shift Money</div>
                                    <div className="mt-1 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1">
                                            <span>Cash:</span>
                                            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsViewingEndBreakdown(true)}><Eye className="h-4 w-4" /></Button>
                                        </div>
                                        <span className="font-medium">€{Number(lastShift.total_cash ?? 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm"><span>Card:</span><span className="font-medium">€{Number(lastShift.total_card ?? 0).toFixed(2)}</span></div>
                                                                         <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                                                                            <span>Total:</span>
                                                                            <span>€{(Number(lastShift.total_cash ?? 0) + Number(lastShift.total_card ?? 0)).toFixed(2)}</span>
                                                                        </div>                                </div>
                            </div>
                        ) : (<div className="text-sm text-muted-foreground">No office shifts available</div>)}
                    </section>
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border" style={{ height: (lastShift && lastShiftHeight) ? `${lastShiftHeight}px` : 'auto' }}>
                        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Sellables</h3><Link href="/sellables"><Button size="sm" variant="ghost">Manage</Button></Link></div>
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                            {orderedSellables.length > 0 ? (orderedSellables.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                                    <div className="flex-1"><div className="text-sm font-medium">{item.name}</div>{item.description && (<div className="line-clamp-1 text-xs text-muted-foreground">{item.description}</div>)}</div>
                                    <div className="ml-2 flex flex-col items-end text-sm">
                                        <div className="font-medium text-muted-foreground">{item.type === 'product' ? `€${Number(item.price).toFixed(2)}` : `€${Number(item.price_with_card).toFixed(2)} / €${Number(item.price_without_card).toFixed(2)}`}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">{item.type === 'event' ? sellPeriodMessage(item.start_sell_date, item.end_sell_date) : ''}</div>
                                    </div>
                                </div>
                            ))) : (<div className="text-sm text-muted-foreground">No sellables available</div>)}
                        </div>
                    </section>
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border" style={{ height: (lastShift && lastShiftHeight) ? `${lastShiftHeight}px` : 'auto' }}>
                        <h3 className="mb-3 text-sm font-semibold">Office Shift Status</h3>
                        {activeShift ? (
                            <div className="space-y-3">
                                <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                                    <div className="text-sm font-semibold text-green-800 dark:text-green-200">Active Shift in Progress</div>
                                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">Started: {formatTimestamp(activeShift.started_at)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">Current Workers</div>
                                    <div className="mt-1 text-sm">{Array.isArray(activeShift.workers) && activeShift.workers.length > 0 ? activeShift.workers.map((w: any) => w.name).join(', ') : 'None'}</div>
                                </div>
                                <Link href={`/office/${activeShift.id}`}><Button className="w-full" variant="default">Manage Active Shift</Button></Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-sm font-medium">No Active Shift</div>
                                    <div className="mt-1 text-xs text-muted-foreground">Start a new shift to begin tracking sales and workers</div>
                                </div>
                                <Button className="w-full" variant="default" onClick={() => { router.post('/office/start', {}, { preserveScroll: true, onSuccess: () => { setTimeout(() => router.get(office().url, {}, { preserveScroll: true, preserveState: true, replace: true }), 300); }, }); }}>Start Office Shift</Button>
                            </div>
                        )}
                    </section>
                </div>
                {message && (<div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform"><Alert><Check /><AlertTitle>{message}</AlertTitle></Alert></div>)}

                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Previous Shift Sales Log</h3>
                        <div className="text-xs text-muted-foreground">{lastShift && Array.isArray(lastShift.sales) ? `${lastShift.sales.length} sales${lastShift.sales.length ? ' | ' + summarizeSales(lastShift.sales) : ''}` : ''}</div>
                    </div>
                    {lastShift && Array.isArray(lastShift.sales) && lastShift.sales.length > 0 && (
                        <>
                            <div className="overflow-x-auto"><div className="max-h-[14rem] overflow-y-auto">
                                <table className="w-full table-fixed text-sm">
                                    <thead><tr className="text-left text-xs text-muted-foreground"><th className="w-4/12">Item</th><th className="w-2/12">Method</th><th className="w-2/12">Amount</th><th className="w-3/12">Description</th><th className="w-2/12">Sold by</th><th className="w-2/12">Sold at</th></tr></thead>
                                    <tbody className="mt-2">
                                        {(lastShift.sales || []).map((sale: any) => (
                                            <tr key={String(sale.id)} className="border-t">
                                                <td className="py-3"><span className="block max-w-[20rem] truncate" title={sale.name ?? 'N/A'}>{sale.name ?? 'N/A'}</span></td>
                                                <td className="py-3 capitalize"><span className="block max-w-[8rem] truncate" title={sale.method}>{sale.method}</span></td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="block max-w-[8rem] truncate" title={`€${Number(sale.amount ?? 0).toFixed(2)}`}>€{Number(sale.amount ?? 0).toFixed(2)}</span>
                                                        {String(sale.method).toLowerCase() === 'cash' && sale.breakdown && (
                                                            <Button size="sm" variant="ghost" onClick={() => setViewingSale(sale)} aria-label="View cash breakdown"><Eye className="h-4 w-4" /></Button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3"><span className="block max-w-[20rem] truncate" title={sale.description ?? ''}>{sale.description ?? ''}</span></td>
                                                <td className="py-3"><span className="block max-w-[16rem] truncate" title={staffMap.get(sale.sold_by) || sale.sold_by}>{staffMap.get(sale.sold_by) || sale.sold_by}</span></td>
                                                <td className="py-3"><span className="block max-w-[12rem] truncate" title={sale.sold_at ?? sale.created_at ?? ''}>{(sale.sold_at ?? sale.created_at) ? new Date(sale.sold_at ?? sale.created_at).toLocaleString() : 'N/A'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div></div>
                            <div className="mt-6 flex justify-end gap-4">
                                <div className="text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <span>Cash Sales</span>
                                        <button type="button" onClick={() => setIsViewingSalesBreakdown(true)} title="View cash distribution for sales" className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-xs">?</button>
                                    </div>
                                    <div className="font-medium">€{lastShift.sales.filter((s: any) => String(s.method).toLowerCase() === 'cash').reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0).toFixed(2)}</div>
                                </div>
                                <div className="text-sm">
                                    <div className="text-muted-foreground">Card Sales</div>
                                    <div className="font-medium">€{lastShift.sales.filter((s: any) => String(s.method).toLowerCase() === 'card').reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0).toFixed(2)}</div>
                                </div>
                                <div className="text-sm">
                                    <div className="text-muted-foreground">Total Sales</div>
                                    <div className="font-semibold">€{lastShift.sales.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0).toFixed(2)}</div>
                                </div>
                            </div>

                            <Dialog open={isViewingStartBreakdown} onOpenChange={(v) => { setIsViewingStartBreakdown(v); setIsPollingPaused(v); }}>
                                <DialogContent>
                                    <DialogTitle>Start of Shift Cash</DialogTitle>
                                    <DialogDescription>Read-only cash distribution at the start of the shift.</DialogDescription>
                                    <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                        {denominationConfig.map((d) => (
                                            <div key={d.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div></div>
                                                <div className="text-sm font-medium">{Number((lastShift?.start_cash_breakdown || {})[d.key] ?? 0)}</div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <div className="text-sm text-muted-foreground">Total</div>
                                            <div className="text-lg font-medium">€{computeBreakdownTotal(lastShift?.start_cash_breakdown || {}).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <DialogFooter><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isViewingEndBreakdown} onOpenChange={(v) => { setIsViewingEndBreakdown(v); setIsPollingPaused(v); }}>
                                <DialogContent>
                                    <DialogTitle>End of Shift Cash</DialogTitle>
                                    <DialogDescription>Read-only cash distribution at the end of the shift.</DialogDescription>
                                    <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                        {denominationConfig.map((d) => (
                                            <div key={d.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div></div>
                                                <div className="text-sm font-medium">{Number((lastShift?.end_of_shift_cash_breakdown || {})[d.key] ?? 0)}</div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <div className="text-sm text-muted-foreground">Total</div>
                                            <div className="text-lg font-medium">€{computeBreakdownTotal(lastShift?.end_of_shift_cash_breakdown || {}).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <DialogFooter><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>

                             <Dialog open={isViewingSalesBreakdown} onOpenChange={(v) => { setIsViewingSalesBreakdown(v); setIsPollingPaused(v); }}>
                                <DialogContent>
                                    <DialogTitle>Last Shift Cash Sales Distribution</DialogTitle>
                                    <DialogDescription>Read-only cash distribution for all cash sales made during the last shift.</DialogDescription>
                                    <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                        {denominationConfig.map((d) => (
                                            <div key={d.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div></div>
                                                <div className="text-sm font-medium">{Number((lastShift?.cash_breakdown || {})[d.key] ?? 0)}</div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <div className="text-sm text-muted-foreground">Total</div>
                                            <div className="text-lg font-medium">€{computeBreakdownTotal(lastShift?.cash_breakdown || {}).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <DialogFooter><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={Boolean(viewingSale)} onOpenChange={(v) => !v && setViewingSale(null)}>
                                <DialogContent>
                                    <DialogTitle>Sale Breakdown</DialogTitle>
                                    <DialogDescription>Read-only cash breakdown for sale #{viewingSale?.id}.</DialogDescription>
                                    <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                        {denominationConfig.map((d) => (
                                            <div key={d.key} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">{d.label}</div></div>
                                                <div className="text-sm font-medium">{Number((viewingSale?.breakdown || {})[d.key] ?? 0)}</div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <div className="text-sm text-muted-foreground">Sale total</div>
                                            <div className="text-lg font-medium">€{Number(viewingSale?.amount || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <DialogFooter><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose></DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>

                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">All Office Shifts</h3>
                    {filteredPastShifts && filteredPastShifts.length > 0 ? (
                        <div className="space-y-3">
                            {filteredPastShifts.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                                    <div>
                                        <div className="text-sm font-medium">{formatTimestamp(s.started_at)} — {formatTimestamp(s.ended_at)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {Array.isArray(s.workers) && s.workers.length > 0 ? s.workers.map((w: any) => w.name).slice(0, 3).join(', ') : 'No workers'}
                                            {Array.isArray(s.workers) && s.workers.length > 3 ? ` +${s.workers.length - 3} more` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">€{(Number(s.total_cash ?? 0) + Number(s.total_card ?? 0)).toFixed(2)}</div>
                                        <Link href={`/office/${s.id}`}><Button size="sm" variant="ghost">Review</Button></Link>
                                        <Dialog>
                                            <DialogTrigger asChild><Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-muted/30">Remove</Button></DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>Delete this office shift?</DialogTitle>
                                                <DialogDescription>Deleting a shift will permanently remove its sales and worker history. This action cannot be undone. Are you sure?</DialogDescription>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                                                    <DialogClose asChild><Button variant="destructive" onClick={() => { router.post(`/office/${s.id}/delete`, {}, { preserveScroll: true, onStart: () => {}, onSuccess: () => { setMessage('Shift deleted'); setTimeout(() => router.get(office().url, {}, { preserveScroll: true, preserveState: true, replace: true }), 500); }, onError: () => setMessage('Failed to delete shift') }); }}>Delete</Button></DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (<div className="text-sm text-muted-foreground">No office shifts available</div>)}
                </div>
            </div>
        </AppLayout>
    );
}
