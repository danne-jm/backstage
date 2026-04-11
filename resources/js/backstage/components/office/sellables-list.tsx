import { Link } from '@inertiajs/react';
import { Button } from '@backstage/components/ui/button';
import { OfficeCard } from './office-card';
import * as React from 'react';

interface SellablesListProps {
    sellables: any[];
    className?: string; // changed
}

export function SellablesList({ sellables, className }: SellablesListProps) {
    // Date-only comparison: office ignores time, only the calendar date matters.
    const toDateOnly = (iso: string) => {
        const d = new Date(iso);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    };
    const todayOnly = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    };

    const isActive = (item: any) => {
        const today = todayOnly();
        if (item.start_sell_date && toDateOnly(item.start_sell_date) > today) return false;
        if (item.end_sell_date && toDateOnly(item.end_sell_date) < today) return false;
        return true;
    };

    const sortedSellables = React.useMemo(() => {
        return [...sellables].sort((a, b) => {
            const activeA = isActive(a);
            const activeB = isActive(b);
            if (activeA && !activeB) return -1;
            if (!activeA && activeB) return 1;
            return 0;
        });
    }, [sellables]);

    const daysRemaining = (iso?: string | null) => {
        if (!iso) return 0;
        const target = toDateOnly(iso);
        const today = todayOnly();
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.ceil((target - today) / msPerDay);
    };

    const sellPeriodMessage = (
        startIso?: string | null,
        endIso?: string | null,
    ) => {
        const today = todayOnly();
        const start = startIso ? toDateOnly(startIso) : null;
        const end = endIso ? toDateOnly(endIso) : null;
        if (!start && !end) return 'Always available';

        if (start && today < start) {
            const days = daysRemaining(startIso);
            return `Sale starts in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        if (end && today > end) {
            return 'Sale ended';
        }
        if (end && today <= end) {
            const days = daysRemaining(endIso);
            return `Sale ends in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        return 'Available';
    };

    return (
        <OfficeCard
            title="Sellables"
            className={className}
            action={
                <Link href="/sellables">
                    <Button size="sm" variant="ghost">
                        Manage
                    </Button>
                </Link>
            }
        >
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {sortedSellables.length > 0 ? (
                    sortedSellables.map((item: any) => (
                        <div
                            key={item.unique_id}
                            className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                    {item.name}
                                </div>
                                {item.description && (
                                    <div className="truncate text-xs text-muted-foreground">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                            <div className="ml-2 flex shrink-0 flex-col items-end text-sm">
                                <div className="font-medium text-muted-foreground">
                                    {item.type === 'product'
                                        ? `€${Number(item.price || 0).toFixed(2)}`
                                        : `€${Number(item.price_with_card || item.price || 0).toFixed(2)} / €${Number(item.price_without_card || 0).toFixed(2)}`}
                                </div>
                                {(item.start_sell_date || item.end_sell_date) && (
                                    <div className="text-xs text-muted-foreground">
                                        {sellPeriodMessage(item.start_sell_date, item.end_sell_date)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No sellables available
                    </div>
                )}
            </div>
        </OfficeCard>
    );
}
