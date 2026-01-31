import { Badge } from '@/Components/Shared/ui/badge';
import { Button } from '@/Components/Shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/Components/Shared/ui/dialog';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import {
    computeBreakdownTotal,
    denominationConfig,
    summarizeSales,
} from './utils';

interface PreviousShiftSalesLogProps {
    lastShift: any;
    staffMap: Map<string, string>;
}

export function PreviousShiftSalesLog({
    lastShift,
    staffMap,
}: PreviousShiftSalesLogProps) {
    const [viewingSale, setViewingSale] = useState<any | null>(null);
    const [isViewingSalesBreakdown, setIsViewingSalesBreakdown] =
        useState(false);

    const cashSalesTotal =
        lastShift?.sales
            ?.filter((s: any) => String(s.method).toLowerCase() === 'cash')
            .reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0) ??
        0;
    const cardSalesTotal =
        lastShift?.sales
            ?.filter((s: any) => String(s.method).toLowerCase() === 'card')
            .reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0) ??
        0;
    const totalSales =
        lastShift?.sales?.reduce(
            (sum: number, s: any) => sum + Number(s.amount ?? 0),
            0,
        ) ?? 0;

    return (
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
                                            <th className="w-[25%] px-1">
                                                Item
                                            </th>
                                            <th className="w-[10%] px-1">
                                                Method
                                            </th>
                                            <th className="w-[15%] px-1">
                                                Amount
                                            </th>
                                            <th className="w-[20%] px-1">
                                                Description
                                            </th>
                                            <th className="w-[15%] px-1">
                                                Sold by
                                            </th>
                                            <th className="w-[15%] px-1">
                                                Sold at
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="mt-2">
                                        {(lastShift.sales || []).map(
                                            (sale: any) => (
                                                <tr
                                                    key={String(sale.id)}
                                                    className="border-t"
                                                >
                                                    <td className="py-3">
                                                        <span
                                                            className="block w-full truncate"
                                                            title={
                                                                sale.name ??
                                                                'N/A'
                                                            }
                                                        >
                                                            {sale.name ?? 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className="capitalize"
                                                            title={sale.method}
                                                        >
                                                            {sale.method}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="block truncate"
                                                                title={`€${Number(sale.amount ?? 0).toFixed(2)}`}
                                                            >
                                                                €
                                                                {Number(
                                                                    sale.amount ??
                                                                    0,
                                                                ).toFixed(2)}
                                                            </span>
                                                            {String(
                                                                sale.method,
                                                            ).toLowerCase() ===
                                                                'cash' &&
                                                                sale.breakdown && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            setViewingSale(
                                                                                sale,
                                                                            )
                                                                        }
                                                                        aria-label="View cash breakdown"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3">
                                                        <span
                                                            className="block w-full truncate"
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
                                                            className="block w-full truncate"
                                                            title={
                                                                staffMap.get(
                                                                    sale.sold_by,
                                                                ) ||
                                                                sale.sold_by
                                                            }
                                                        >
                                                            {staffMap.get(
                                                                sale.sold_by,
                                                            ) || sale.sold_by}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span
                                                            className="block w-full truncate"
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
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <div className="text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Cash Sales</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setIsViewingSalesBreakdown(true)
                                        }
                                        title="View cash distribution for sales"
                                        className="inline-flex h-4 w-4 items-center justify-center rounded-full border text-xs"
                                    >
                                        ?
                                    </button>
                                </div>
                                <div className="font-medium">
                                    €{cashSalesTotal.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-muted-foreground">
                                    Card Sales
                                </div>
                                <div className="font-medium">
                                    €{cardSalesTotal.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-muted-foreground">
                                    Total Sales
                                </div>
                                <div className="font-semibold">
                                    €{totalSales.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <Dialog
                            open={isViewingSalesBreakdown}
                            onOpenChange={setIsViewingSalesBreakdown}
                        >
                            <DialogContent>
                                <DialogTitle>
                                    Last Shift Cash Sales Distribution
                                </DialogTitle>
                                <DialogDescription>
                                    Read-only cash distribution for all cash
                                    sales made during the last shift.
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
                                                    (lastShift?.cash_breakdown ||
                                                        {})[d.key] ?? 0,
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
                                                lastShift?.cash_breakdown || {},
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={Boolean(viewingSale)}
                            onOpenChange={(v) => !v && setViewingSale(null)}
                        >
                            <DialogContent>
                                <DialogTitle>Sale Breakdown</DialogTitle>
                                <DialogDescription>
                                    Read-only cash breakdown for sale #
                                    {viewingSale?.id}.
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
                                                    (viewingSale?.breakdown ||
                                                        {})[d.key] ?? 0,
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between border-t pt-2">
                                        <div className="text-sm text-muted-foreground">
                                            Sale total
                                        </div>
                                        <div className="text-lg font-medium">
                                            €
                                            {Number(
                                                viewingSale?.amount || 0,
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                            </DialogContent>
                        </Dialog>
                    </>
                )}
        </div>
    );
}
