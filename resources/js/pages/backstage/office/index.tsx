import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { index as officeRoute } from '@/routes/backstage/office';
import { start as shiftStartRoute, show as shiftShowRoute } from '@/routes/backstage/office/shift';
import { index as sellablesRoute } from '@/routes/backstage/sellables';

function formatDate(dateStr: string, formatStyle: 'short' | 'long' | 'medium' = 'long') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (formatStyle === 'short') {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');
    }
    if (formatStyle === 'medium') {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    }
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
}

function getSaleStatus(startSellDate: string | null, endSellDate: string | null) {
    if (!startSellDate && !endSellDate) return null;
    const now = new Date();
    
    if (startSellDate) {
        const start = new Date(startSellDate);
        if (now < start) {
            const diffTime = start.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 1 ? `Sale starts in ${diffDays} days` : 'Sale starts soon';
        }
    }
    
    if (endSellDate) {
        const end = new Date(endSellDate);
        const diffTime = end.getTime() - now.getTime();
        if (diffTime < 0) return 'Sale ended';
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `Sale ends in ${diffDays} days`;
    }
    
    return 'Active';
}

const MEMBERSHIP_NAME = import.meta.env.VITE_MEMBERSHIP_CARD_NAME || '[CONFIGURE MEMEBERSHIP IN ENVIRONMENT]';

export default function Office({ current_shift, last_closed_shift, sellables, transactions, all_shifts }: any) {
    const { post: startShift, processing: startingShift } = useForm({
        start_cash_breakdown: [], 
    });

    const handleStartShift = () => {
        startShift(shiftStartRoute().url);
    };

    return (
        <>
            <Head title="Office Shifts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                
                {/* Top Row: Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    
                    {/* Last Office Shift */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border h-full min-h-[20rem]">
                        <div className="mb-3 flex flex-row items-center justify-between">
                            <h3 className="text-sm font-semibold">Last Office Shift</h3>
                            <div>
                                {last_closed_shift && (
                                    <Button variant="ghost" size="sm" className="h-8 px-3" asChild>
                                        <Link href={shiftShowRoute({ shift: last_closed_shift.id }).url}>
                                            Review
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            {last_closed_shift ? (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Started</div>
                                        <div className="text-sm font-medium">{formatDate(last_closed_shift.started_at)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Ended</div>
                                        <div className="text-sm font-medium">{formatDate(last_closed_shift.ended_at)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Workers</div>
                                        <div className="text-sm">{last_closed_shift.workers.map((w: any) => w.name).join(', ') || last_closed_shift.starter.name}</div>
                                    </div>
                                    <div className="border-t pt-3 border-border/50">
                                        <div className="text-xs text-muted-foreground">Start Money</div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <span>Cash:</span>
                                                <Button variant="ghost" size="icon" className="size-9 h-5 w-5">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <span className="font-medium">€{Number(last_closed_shift.expected_cash_total - last_closed_shift.discrepancy_amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Card:</span>
                                            <span className="font-medium">€0.00</span>
                                        </div>
                                    </div>
                                    <div className="border-t pt-3 border-border/50">
                                        <div className="text-xs text-muted-foreground">Office Shift Revenue</div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1">
                                                <span>Cash:</span>
                                                <Button variant="ghost" size="icon" className="size-9 h-5 w-5">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <span className="font-medium">€{Number(last_closed_shift.expected_cash_total).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Card:</span>
                                            <span className="font-medium">€0.00</span>
                                        </div>
                                        <div className="mt-2 flex justify-between border-t border-border/50 pt-2 text-sm font-semibold">
                                            <span>Total:</span>
                                            <span>€{Number(last_closed_shift.expected_cash_total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">No previous shifts found.</div>
                            )}
                        </div>
                    </section>

                    {/* Sellables */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border h-full min-h-[20rem]">
                        <div className="mb-3 flex flex-row items-center justify-between">
                            <h3 className="text-sm font-semibold">Sellables</h3>
                            <div>
                                <Button variant="ghost" size="sm" className="h-8 px-3" asChild>
                                    <Link href={sellablesRoute().url}>Manage</Link>
                                </Button>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                                {sellables.map((sellable: any) => {
                                    const saleStatus = sellable.type === 'App\\Models\\Event' ? getSaleStatus(sellable.start_sell_date, sellable.end_sell_date) : null;
                                    return (
                                        <div key={sellable.id} className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                                            <div className="min-w-0 flex-1 pr-4">
                                                <div className="truncate text-sm font-medium">{sellable.name}</div>
                                                <div className="truncate text-xs text-muted-foreground">{sellable.description}</div>
                                            </div>
                                            <div className="ml-2 flex shrink-0 flex-col items-end text-sm">
                                                {sellable.price_with_membership !== null && sellable.price_without_membership !== null && Number(sellable.price_with_membership) !== Number(sellable.price_without_membership) ? (
                                                    <div className="font-medium text-muted-foreground">€{Number(sellable.price_with_membership).toFixed(2)} / €{Number(sellable.price_without_membership).toFixed(2)}</div>
                                                ) : sellable.variable_amount ? (
                                                    <div className="font-medium text-muted-foreground">Variable Amount</div>
                                                ) : (
                                                    <div className="font-medium text-muted-foreground">€{Number(sellable.price).toFixed(2)}</div>
                                                )}
                                                {saleStatus && (
                                                    <div className="text-xs text-muted-foreground">{saleStatus}</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Office Shift Status */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border h-full min-h-[20rem]">
                        <div className="mb-3 flex flex-row items-center justify-between">
                            <h3 className="text-sm font-semibold">Office Shift Status</h3>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            {current_shift ? (
                                <div className="space-y-3">
                                    <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                                        <div className="text-sm font-semibold text-green-800 dark:text-green-200">Active Shift in Progress</div>
                                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">Started: {formatDate(current_shift.started_at)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Current Workers</div>
                                        <div className="text-sm">{current_shift.workers.map((w: any) => w.name).join(', ') || current_shift.starter.name}</div>
                                    </div>
                                    <Button asChild className="w-full">
                                        <Link href={shiftShowRoute({ shift: current_shift.id }).url}>
                                            Manage Active Shift
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-md bg-muted/40 p-3">
                                        <div className="text-sm font-medium">No Active Shift</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Start a new shift to begin tracking sales and workers</div>
                                    </div>
                                    <Button onClick={handleStartShift} disabled={startingShift} className="w-full">
                                        Start Office Shift
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Bottom Row: Tables */}
                <div className="flex flex-col gap-4">
                    
                    {/* Previous Shift Sales Log */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex flex-row items-center justify-between">
                            <h3 className="text-sm font-semibold">Previous Shift Sales Log</h3>
                            <div className="text-xs text-muted-foreground">{transactions.reduce((acc: number, t: any) => acc + t.sales.length, 0)} sales</div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border/40 text-left text-muted-foreground uppercase tracking-wider">
                                            <th className="pb-3 font-medium px-2">ITEM</th>
                                            <th className="pb-3 font-medium px-2">METHOD</th>
                                            <th className="pb-3 font-medium px-2">AMOUNT</th>
                                            <th className="pb-3 font-medium px-2">DESCRIPTION</th>
                                            <th className="pb-3 font-medium px-2">SOLD BY</th>
                                            <th className="pb-3 font-medium px-2">SOLD AT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {transactions.map((tx: any) => (
                                            tx.sales.map((sale: any) => (
                                                <tr key={sale.id} className="border-b border-border/20 last:border-0 hover:bg-muted/40">
                                                    <td className="py-2.5 px-2">{sale.name} {sale.quantity > 1 && <span className="text-muted-foreground ml-1">x{sale.quantity}</span>}</td>
                                                    <td className="py-2.5 px-2">
                                                        <div className="flex gap-1.5 items-center">
                                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm font-normal h-5 border-border/50 ${tx.channel === 'online' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : ''}`}>
                                                                {tx.channel === 'online' ? 'Online' : 'Cash'}
                                                            </Badge>
                                                            {sale.ticket_type === 'with_membership' && (
                                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm font-normal h-5">{MEMBERSHIP_NAME}</Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2">€{Number(sale.subtotal).toFixed(2)}</td>
                                                    <td className="py-2.5 px-2 text-muted-foreground"></td>
                                                    <td className="py-2.5 px-2">{last_closed_shift?.starter?.name || ''}</td>
                                                    <td className="py-2.5 px-2 text-muted-foreground">{formatDate(tx.completed_at, 'short')}</td>
                                                </tr>
                                            ))
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                                                    No recent sales to display.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {transactions.length > 0 && (
                                <div className="flex justify-end gap-6 pt-4 text-xs">
                                    <div className="text-right">
                                        <p className="text-muted-foreground mb-0.5">Cash Sales</p>
                                        <p className="font-semibold text-sm">€{transactions.filter((t: any) => t.payment_method === 'pos_cash').reduce((acc: number, t: any) => acc + Number(t.total_amount), 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground mb-0.5">Card Sales</p>
                                        <p className="font-semibold text-sm">€{transactions.filter((t: any) => t.payment_method === 'pos_card' || t.payment_method === 'sumup_online').reduce((acc: number, t: any) => acc + Number(t.total_amount), 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground mb-0.5">Total Sales</p>
                                        <p className="font-semibold text-sm">€{transactions.reduce((acc: number, t: any) => acc + Number(t.total_amount), 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* All Office Shifts */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex flex-row items-center justify-between">
                            <h3 className="text-sm font-semibold">All Office Shifts</h3>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b text-xs text-muted-foreground uppercase">
                                        <tr>
                                            <th className="px-1 py-3 font-medium">Status</th>
                                            <th className="px-1 py-3 font-medium">Started At</th>
                                            <th className="px-1 py-3 font-medium">Ended At</th>
                                            <th className="px-1 py-3 font-medium">Workers</th>
                                            <th className="px-1 py-3 text-right font-medium">Cash</th>
                                            <th className="px-1 py-3 text-right font-medium">Card</th>
                                            <th className="px-1 py-3 text-right font-medium">Total</th>
                                            <th className="px-1 py-3 text-right"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {all_shifts.data.length > 0 ? (
                                            all_shifts.data.map((shift: any) => {
                                                const workersStr = shift.workers.map((w: any) => w.name).join(', ') || shift.starter.name;
                                                return (
                                                    <tr key={shift.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                                                        <td className="px-1 py-3">
                                                            {shift.status === 'open' ? (
                                                                <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 overflow-hidden border-transparent bg-primary text-primary-foreground capitalize">
                                                                    open
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 overflow-hidden border-transparent bg-secondary text-secondary-foreground capitalize">
                                                                    closed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-1 py-3 whitespace-nowrap">{formatDate(shift.started_at, 'medium')}</td>
                                                        <td className="px-1 py-3 whitespace-nowrap">{shift.ended_at ? formatDate(shift.ended_at, 'medium') : '-'}</td>
                                                        <td className="px-1 py-3">
                                                            <div className="max-w-[200px] truncate" title={workersStr}>{workersStr}</div>
                                                        </td>
                                                        <td className="px-1 py-3 text-right">€{Number(shift.expected_cash_total).toFixed(2)}</td>
                                                        <td className="px-1 py-3 text-right">€0.00</td>
                                                        <td className="px-1 py-3 text-right font-medium">€{Number(shift.expected_cash_total).toFixed(2)}</td>
                                                        <td className="px-1 py-3 text-right">
                                                            <Button variant="ghost" size="sm" className="h-8 px-3" asChild>
                                                                <Link href={shiftShowRoute({ shift: shift.id }).url}>
                                                                    Review
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                                                    No office shifts have been recorded yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

Office.layout = {
    breadcrumbs: [
        {
            title: 'Office Shifts',
            href: officeRoute().url,
        },
    ],
};
