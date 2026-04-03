import { Head, Link, usePage } from '@inertiajs/react';
import { LastShiftSummary } from '@backstage/components/office/last-shift-summary';
import { OfficeShiftStatus } from '@backstage/components/office/office-shift-status';
import { PreviousShiftSalesLog } from '@backstage/components/office/previous-shift-sales-log';
import { SellablesList } from '@backstage/components/office/sellables-list';
import { formatTimestamp } from '@backstage/components/office/utils';
import { Badge } from '@backstage/components/ui/badge';
import { Button } from '@backstage/components/ui/button';

import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office',
        href: '/office',
    },
];

export default function Office() {
    const { props: initialProps } = usePage<any>();
    // Cast to any since we are expecting these from backend potentially, or default to null/empty
    const props = initialProps as any;
    const canCreate = true;

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const previousSales: any[] = props['previousSales'] ?? [];
    const allShifts: any[] = props['allShifts'] ?? [];
    const sellables: any[] = Array.isArray(props['sellables'])
        ? props['sellables']
        : [];

    const orderedSellables = sellables;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <LastShiftSummary
                        lastShift={lastShift}
                        className="h-full min-h-[20rem]"
                    />
                    <SellablesList
                        sellables={orderedSellables}
                        className="h-full min-h-[20rem]"
                    />
                    <OfficeShiftStatus
                        activeShift={activeShift}
                        className="h-full min-h-[20rem]"
                        canCreate={canCreate}
                    />
                </div>

                <PreviousShiftSalesLog sales={previousSales} totals={lastShift} />

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">
                        All Office Shifts
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-1 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-1 py-3 font-medium">
                                        Started At
                                    </th>
                                    <th className="px-1 py-3 font-medium">
                                        Ended At
                                    </th>
                                    <th className="px-1 py-3 font-medium">
                                        Workers
                                    </th>
                                    <th className="px-1 py-3 text-right font-medium">
                                        Cash
                                    </th>
                                    <th className="px-1 py-3 text-right font-medium">
                                        Card
                                    </th>
                                    <th className="px-1 py-3 text-right font-medium">
                                        Total
                                    </th>
                                    <th className="px-1 py-3 text-right">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {allShifts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No office shifts available
                                        </td>
                                    </tr>
                                ) : (
                                    allShifts.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="border-b transition-colors last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="px-1 py-3">
                                                <Badge
                                                    variant={
                                                        s.status === 'open'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {s.status}
                                                </Badge>
                                            </td>
                                            <td className="px-1 py-3 whitespace-nowrap">
                                                {formatTimestamp(s.started_at)}
                                            </td>
                                            <td className="px-1 py-3 whitespace-nowrap">
                                                {s.ended_at
                                                    ? formatTimestamp(
                                                        s.ended_at,
                                                    )
                                                    : '-'}
                                            </td>
                                            <td className="px-1 py-3">
                                                <div
                                                    className="max-w-[200px] truncate"
                                                    title={s.workers}
                                                >
                                                    {s.workers}
                                                </div>
                                            </td>
                                            <td className="px-1 py-3 text-right">
                                                €
                                                {Number(
                                                    s.cash_total || 0,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-1 py-3 text-right">
                                                €
                                                {Number(
                                                    s.card_total || 0,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="px-1 py-3 text-right font-medium">
                                                €
                                                {Number(s.total || 0).toFixed(
                                                    2,
                                                )}
                                            </td>
                                            <td className="px-1 py-3 text-right">
                                                <Link href={`/office/${s.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        Review
                                                    </Button>
                                                </Link>
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
