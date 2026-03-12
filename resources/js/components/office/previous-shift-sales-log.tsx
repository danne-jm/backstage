import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { OfficeCard } from './office-card';

interface PreviousShiftSalesLogProps {
    sales: any[];
    className?: string;
}

export function PreviousShiftSalesLog({
    sales,
    className,
}: PreviousShiftSalesLogProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const cashTotal = sales
        .filter((s) => s.method === 'cash')
        .reduce((sum, s) => sum + Number(s.amount), 0);
    const cardTotal = sales
        .filter((s) => s.method === 'card')
        .reduce((sum, s) => sum + Number(s.amount), 0);
    const total = cashTotal + cardTotal;

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy, HH:mm:ss');
        } catch {
            return '';
        }
    };

    // Group sales by item for a summary
    const summary = sales.reduce((acc: Record<string, number>, s) => {
        acc[s.name] = (acc[s.name] || 0) + 1;
        return acc;
    }, {});

    const summaryText = Object.entries(summary)
        .map(([name, count]) => `${name} ${count}`)
        .join(' | ');

    return (
        <OfficeCard
            title="Previous Shift Sales Log"
            className={className}
            action={
                <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                        {sales.length} sales | {summaryText}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            }
        >
            <div className={cn('space-y-4', !isExpanded && 'hidden')}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="border-b text-muted-foreground uppercase">
                            <tr>
                                <th className="px-1 py-2 font-medium">Item</th>
                                <th className="px-1 py-2 font-medium">
                                    Method
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Amount
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Description
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Sold by
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Sold at
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground italic"
                                    >
                                        No sales were recorded for this shift.
                                    </td>
                                </tr>
                            ) : (
                                sales.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="border-b last:border-0"
                                    >
                                        <td
                                            className="max-w-[120px] truncate px-1 py-2"
                                            title={s.name}
                                        >
                                            {s.name}
                                        </td>
                                        <td className="px-1 py-2">
                                            <div className="flex gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className="px-1.5 py-0 text-[10px] capitalize"
                                                >
                                                    {s.method}
                                                </Badge>
                                                {s.ticket_type ===
                                                    'with_card' && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-white bg-white px-1.5 py-0 text-[10px] text-black hover:bg-white/90"
                                                        >
                                                            ESNcard
                                                        </Badge>
                                                    )}
                                                {s.is_custom && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="px-1.5 py-0 text-[10px]"
                                                    >
                                                        Custom
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-1 py-2 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                €{Number(s.amount).toFixed(2)}
                                                {/*  {s.method === 'cash' && <Eye className="h-3 w-3 text-muted-foreground/50" />} */}
                                            </div>
                                        </td>
                                        <td
                                            className="max-w-[150px] truncate px-1 py-2"
                                            title={s.description}
                                        >
                                            {s.description}
                                        </td>
                                        <td className="px-1 py-2 whitespace-nowrap">
                                            {s.sold_by}
                                        </td>
                                        <td className="px-1 py-2 whitespace-nowrap">
                                            {formatDateTime(s.sold_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-6 border-t pt-2 text-xs font-medium">
                    <div className="flex flex-col items-end">
                        <div className="text-muted-foreground">Cash Sales </div>
                        <div className="text-sm font-semibold">
                            €{cashTotal.toFixed(2)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-muted-foreground">Card Sales</div>
                        <div className="text-sm font-semibold">
                            €{cardTotal.toFixed(2)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-muted-foreground">Total Sales</div>
                        <div className="text-sm font-bold">
                            €{total.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
            {!isExpanded && (
                <div className="flex justify-end gap-6 pt-2 text-xs font-medium">
                    <div className="flex flex-col items-end">
                        <div className="text-sm font-semibold">
                            Cash: €{cashTotal.toFixed(2)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-sm font-semibold">
                            Card: €{cardTotal.toFixed(2)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-sm font-bold">
                            Total: €{total.toFixed(2)}
                        </div>
                    </div>
                </div>
            )}
        </OfficeCard>
    );
}
