import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@backstage/components/ui/badge';
import { Button } from '@backstage/components/ui/button';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';

interface Filters {
    from_date: string;
    to_date: string;
}

interface Summary {
    total_credit: number;
    total_debit: number;
    net: number;
    entries_count: number;
}

interface BreakdownRow {
    label: string;
    credit: number;
    debit: number;
    net: number;
    count: number;
}

interface DailyPoint {
    day: string;
    credit: number;
    debit: number;
    net: number;
}

interface LedgerEntry {
    id: string;
    entry_type: string;
    direction: 'credit' | 'debit';
    amount: number;
    currency: string;
    channel: string | null;
    payment_method: string | null;
    source_type: string;
    source_reference: string | null;
    idempotency_key: string;
    occurred_at: string | null;
    metadata?: Record<string, unknown> | null;
}

interface AccountingProps {
    filters: Filters;
    summary: Summary;
    breakdowns: {
        channels: BreakdownRow[];
        payment_methods: BreakdownRow[];
        entry_types: BreakdownRow[];
    };
    daily: DailyPoint[];
    entries: LedgerEntry[];
    setupRequired?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Store Manager', href: '/store-manager' },
    { title: 'All Sales', href: '/store-manager/all-sales' },
    { title: 'Accounting', href: '/store-manager/all-sales/accounting' },
];

function euro(v: number) {
    return `€${Number(v || 0).toFixed(2)}`;
}

function when(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function applyFilters(filters: Filters, updates: Partial<Filters>) {
    const next = { ...filters, ...updates };
    router.get('/store-manager/all-sales/accounting', next, { preserveState: true });
}

function BreakdownTable({ title, rows }: { title: string; rows: BreakdownRow[] }) {
    return (
        <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium">Bucket</th>
                            <th className="px-4 py-2 text-right font-medium">Credit</th>
                            <th className="px-4 py-2 text-right font-medium">Debit</th>
                            <th className="px-4 py-2 text-right font-medium">Net</th>
                            <th className="px-4 py-2 text-right font-medium">Entries</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                    No accounting data for selected range.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.label} className="border-t">
                                    <td className="px-4 py-2 font-medium">{r.label}</td>
                                    <td className="px-4 py-2 text-right">{euro(r.credit)}</td>
                                    <td className="px-4 py-2 text-right">{euro(r.debit)}</td>
                                    <td className={`px-4 py-2 text-right font-semibold ${r.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {euro(r.net)}
                                    </td>
                                    <td className="px-4 py-2 text-right">{r.count}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function Accounting({ filters, summary, breakdowns, daily, entries, setupRequired = false }: AccountingProps) {
    const headerActions = (
        <Link href="/store-manager/all-sales">
            <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                All Sales
            </Button>
        </Link>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <Head title="Store Accounting" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {setupRequired && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="text-sm font-semibold">Ledger setup required</div>
                        <div className="mt-1 text-sm">
                            The `financial_ledger_entries` table was not found, so accounting data is currently empty.
                            Run your database migrations (and optionally the ledger backfill) to populate this page.
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">From</label>
                        <input
                            type="date"
                            value={filters.from_date}
                            max={filters.to_date}
                            onChange={(e) => applyFilters(filters, { from_date: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">To</label>
                        <input
                            type="date"
                            value={filters.to_date}
                            min={filters.from_date}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => applyFilters(filters, { to_date: e.target.value })}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                    </div>

                    <div className="ml-auto text-right">
                        <div className="text-xs text-muted-foreground">Ledger entries</div>
                        <div className="text-sm font-semibold">{summary.entries_count}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4">
                        <div className="text-xs text-muted-foreground">Total Credit</div>
                        <div className="mt-1 text-xl font-semibold text-emerald-600">{euro(summary.total_credit)}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                        <div className="text-xs text-muted-foreground">Total Debit</div>
                        <div className="mt-1 text-xl font-semibold text-red-600">{euro(summary.total_debit)}</div>
                    </div>
                    <div className="rounded-xl border bg-card p-4 md:col-span-2">
                        <div className="text-xs text-muted-foreground">Net</div>
                        <div className={`mt-1 text-xl font-bold ${summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {euro(summary.net)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                    <BreakdownTable title="By Channel" rows={breakdowns.channels} />
                    <BreakdownTable title="By Payment Method" rows={breakdowns.payment_methods} />
                    <BreakdownTable title="By Entry Type" rows={breakdowns.entry_types} />
                </div>

                <div className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-3">
                        <h3 className="text-sm font-semibold">Daily Net Trend</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">Day</th>
                                    <th className="px-4 py-2 text-right font-medium">Credit</th>
                                    <th className="px-4 py-2 text-right font-medium">Debit</th>
                                    <th className="px-4 py-2 text-right font-medium">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daily.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                                            No daily accounting points in this range.
                                        </td>
                                    </tr>
                                ) : (
                                    daily.map((d) => (
                                        <tr key={d.day} className="border-t">
                                            <td className="px-4 py-2 font-medium">{d.day}</td>
                                            <td className="px-4 py-2 text-right">{euro(d.credit)}</td>
                                            <td className="px-4 py-2 text-right">{euro(d.debit)}</td>
                                            <td className={`px-4 py-2 text-right font-semibold ${d.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {euro(d.net)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-3">
                        <h3 className="text-sm font-semibold">Ledger Entries (latest 500)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium">When</th>
                                    <th className="px-4 py-2 text-left font-medium">Type</th>
                                    <th className="px-4 py-2 text-left font-medium">Direction</th>
                                    <th className="px-4 py-2 text-left font-medium">Channel</th>
                                    <th className="px-4 py-2 text-left font-medium">Method</th>
                                    <th className="px-4 py-2 text-left font-medium">Source</th>
                                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                                            No ledger entries for selected range.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((e) => (
                                        <tr key={e.id} className="border-t">
                                            <td className="px-4 py-2 whitespace-nowrap">{when(e.occurred_at)}</td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{e.entry_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Badge variant={e.direction === 'credit' ? 'default' : 'destructive'}>
                                                    {e.direction}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2">{e.channel ?? 'unknown'}</td>
                                            <td className="px-4 py-2">{e.payment_method ?? 'unknown'}</td>
                                            <td className="px-4 py-2">
                                                <div className="max-w-[260px] truncate" title={`${e.source_type}:${e.source_reference ?? ''}`}>
                                                    {e.source_type}{e.source_reference ? `:${e.source_reference}` : ''}
                                                </div>
                                            </td>
                                            <td className={`px-4 py-2 text-right font-semibold ${e.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {e.direction === 'credit' ? '+' : '-'}{euro(e.amount)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
