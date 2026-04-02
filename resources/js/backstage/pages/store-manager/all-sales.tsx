import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, MailCheck, MailX, ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@backstage/components/ui/badge';
import { Button } from '@backstage/components/ui/button';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';

interface SaleItem {
    id: string;
    name: string;
    method: 'cash' | 'card' | 'online';
    amount: number;
    ticket_type: string | null;
    variant_opts: Record<string, string> | null;
    code_used?: string | null;
    reference_id?: string | null;
    description?: string | null;
    sold_at: string | null;
    // online-only
    online_transaction_id?: string | null;
    transaction_ref?: string | null;
    email?: string | null;
    mail_success?: boolean | null;
}

interface Filters {
    from_date: string;
    to_date: string;
    method: 'all' | 'cash' | 'card' | 'online';
}

interface AllSalesProps {
    filters: Filters;
    sales: SaleItem[];
    storeUrl: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Store Manager', href: '/store-manager' },
    { title: 'All Sales', href: '/store-manager/all-sales' },
];

function fmtTime(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayHeading(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
}

function dayKey(iso: string | null) {
    if (!iso) return 'unknown';
    return iso.slice(0, 10);
}

function MethodBadge({ method }: { method: string }) {
    if (method === 'online') {
        return (
            <Badge className="border-transparent bg-blue-800 text-white hover:bg-blue-800 shrink-0">
                Online
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="capitalize shrink-0">
            {method}
        </Badge>
    );
}

// Build render segments for a day's items.
// Consecutive online sales with the same online_transaction_id get a shared header.
type Segment =
    | { kind: 'tx'; txId: string; txRef: string; email: string; mailSuccess: boolean | null; items: SaleItem[] }
    | { kind: 'row'; item: SaleItem };

function buildSegments(items: SaleItem[]): Segment[] {
    const segments: Segment[] = [];
    let i = 0;
    while (i < items.length) {
        const item = items[i];
        if (item.method === 'online' && item.online_transaction_id) {
            const txId = item.online_transaction_id;
            const txItems: SaleItem[] = [];
            while (i < items.length && items[i].online_transaction_id === txId) {
                txItems.push(items[i]);
                i++;
            }
            segments.push({
                kind: 'tx',
                txId,
                txRef: txItems[0].transaction_ref ?? txId,
                email: txItems[0].email ?? '',
                mailSuccess: txItems[0].mail_success ?? null,
                items: txItems,
            });
        } else {
            segments.push({ kind: 'row', item });
            i++;
        }
    }
    return segments;
}

export default function AllSales({ filters, sales, storeUrl }: AllSalesProps) {
    const [local, setLocal] = useState<Filters>({ ...filters });

    function apply() {
        router.get('/store-manager/all-sales', local as unknown as Record<string, string>, { preserveState: true });
    }

    function reset() {
        const d: Filters = {
            from_date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
            to_date: new Date().toISOString().slice(0, 10),
            method: 'all',
        };
        setLocal(d);
        router.get('/store-manager/all-sales', d as unknown as Record<string, string>, { preserveState: true });
    }

    // Group sales by day
    const grouped: { day: string; label: string; items: SaleItem[] }[] = [];
    for (const sale of sales) {
        const key = dayKey(sale.sold_at);
        let group = grouped.find(g => g.day === key);
        if (!group) {
            group = { day: key, label: sale.sold_at ? fmtDayHeading(sale.sold_at) : 'Unknown date', items: [] };
            grouped.push(group);
        }
        group.items.push(sale);
    }

    const totalAmount = sales.reduce((s, r) => s + r.amount, 0);

    const headerActions = (
        <Link href="/store-manager">
            <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Store Manager
            </Button>
        </Link>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <Head title="All Sales" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Filter bar */}
                <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">From</label>
                        <input
                            type="date"
                            value={local.from_date}
                            max={local.to_date}
                            onChange={e => setLocal(f => ({ ...f, from_date: e.target.value }))}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">To</label>
                        <input
                            type="date"
                            value={local.to_date}
                            min={local.from_date}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setLocal(f => ({ ...f, to_date: e.target.value }))}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Method</label>
                        <div className="flex rounded-md border border-input overflow-hidden h-9 text-sm">
                            {(['all', 'cash', 'card', 'online'] as const).map(v => (
                                <button
                                    key={v}
                                    onClick={() => setLocal(f => ({ ...f, method: v }))}
                                    className={`px-3 capitalize transition-colors ${local.method === v ? 'bg-foreground text-background font-medium' : 'bg-background text-foreground hover:bg-muted'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-end gap-2 ml-auto">
                        <div className="text-right mr-1">
                            <div className="text-xs text-muted-foreground">{sales.length} sale{sales.length !== 1 ? 's' : ''}</div>
                            <div className="text-sm font-semibold">€{totalAmount.toFixed(2)}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
                        <Button size="sm" onClick={apply}>Apply</Button>
                    </div>
                </div>

                {/* Sales list */}
                {sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16 text-center text-muted-foreground">
                        <ShoppingBag className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No sales found for the selected filters.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {grouped.map(group => {
                            const dayTotal = group.items.reduce((s, r) => s + r.amount, 0);
                            const segments = buildSegments(group.items);

                            return (
                                <div key={group.day}>
                                    <div className="flex items-baseline justify-between mb-2 px-1">
                                        <span className="text-sm font-semibold">{group.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {group.items.length} sale{group.items.length !== 1 ? 's' : ''} · €{dayTotal.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border bg-card overflow-hidden">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                {segments.map((seg, si) => {
                                                    if (seg.kind === 'tx') {
                                                        const confirmUrl = `${storeUrl}/confirmation?bag=${seg.txRef}`;
                                                        return (
                                                            <React.Fragment key={`tx-${seg.txId}`}>
                                                                {/* Transaction header row */}
                                                                <tr
                                                                    className={`bg-muted/40 ${si > 0 ? 'border-t border-border' : ''}`}
                                                                >
                                                                    <td className="px-4 py-2 text-xs text-muted-foreground font-mono w-16 align-middle" />
                                                                    <td className="px-2 py-2 align-middle">
                                                                        <div className="flex flex-wrap items-center gap-3">
                                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                                {seg.txRef}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground">{seg.email}</span>
                                                                            {seg.mailSuccess === true && (
                                                                                <MailCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                                                            )}
                                                                            {seg.mailSuccess === false && (
                                                                                <MailX className="h-3.5 w-3.5 text-destructive shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-2 py-2 align-middle" />
                                                                    <td className="px-4 py-2 align-middle text-right">
                                                                        <a
                                                                            href={confirmUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <Button variant="outline" size="sm" className="h-6 gap-1 px-2 text-xs">
                                                                                <ExternalLink className="h-3 w-3" />
                                                                                Receipt
                                                                            </Button>
                                                                        </a>
                                                                    </td>
                                                                </tr>

                                                                {/* Sale item rows */}
                                                                {seg.items.map((sale, idx) => (
                                                                    <SaleRow
                                                                        key={sale.id}
                                                                        sale={sale}
                                                                        isFirst={idx === 0}
                                                                        indent
                                                                    />
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    }

                                                    return (
                                                        <SaleRow
                                                            key={seg.item.id}
                                                            sale={seg.item}
                                                            isFirst={si === 0}
                                                        />
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function SaleRow({ sale, isFirst, indent }: { sale: SaleItem; isFirst: boolean; indent?: boolean }) {
    const variantLabel = sale.variant_opts
        ? Object.entries(sale.variant_opts).map(([k, v]) => `${k}: ${v}`).join(' · ')
        : null;

    return (
        <tr className={isFirst ? '' : 'border-t border-border'}>
            {/* Time — fixed width, consistent left edge */}
            <td className={`py-2.5 text-xs text-muted-foreground font-mono w-16 shrink-0 align-middle ${indent ? 'pl-7 pr-2' : 'px-4'}`}>
                {fmtTime(sale.sold_at)}
            </td>

            {/* Name + variant + discount code + ref id */}
            <td className="px-2 py-2.5 align-middle">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium">{sale.name}</span>
                    {variantLabel && (
                        <span className="text-xs text-muted-foreground">{variantLabel}</span>
                    )}
                    {sale.code_used && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {sale.code_used}
                        </Badge>
                    )}
                    {sale.reference_id && sale.method === 'online' && (
                        <span className="text-[10px] font-mono text-muted-foreground">{sale.reference_id}</span>
                    )}
                </div>
            </td>

            {/* ESNcard + method badge — right-aligned, no wrap */}
            <td className="px-2 py-2.5 align-middle text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                    {sale.ticket_type === 'with_card' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">ESNcard</Badge>
                    )}
                    <MethodBadge method={sale.method} />
                </div>
            </td>

            {/* Amount */}
            <td className="px-4 py-2.5 align-middle text-right font-semibold tabular-nums">
                €{sale.amount.toFixed(2)}
            </td>
        </tr>
    );
}
