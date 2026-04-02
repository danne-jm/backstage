import { Link } from '@inertiajs/react';
import { Button } from '@backstage/components/ui/button';
import { OfficeCard } from './office-card';
import * as React from 'react';

interface SellablesListProps {
    sellables: any[];
    className?: string; // changed
}

export function SellablesList({ sellables, className }: SellablesListProps) {
    const sortedSellables = React.useMemo(() => {
        return [...sellables].sort((a, b) => {
            const now = new Date().getTime();

            // Helper to determine if an item has started selling
            const hasStarted = (item: any) => {
                // Products (no type or type='product') are usually always available unless logic says otherwise.
                // Events have start_sell_date.
                if (item.type === 'event') {
                    if (!item.start_sell_date) return true; // No start date = started?
                    const start = new Date(item.start_sell_date).getTime();
                    return start <= now;
                }
                // For products, assume started/available
                return true;
            };

            const startedA = hasStarted(a);
            const startedB = hasStarted(b);

            if (startedA && !startedB) return -1;
            if (!startedA && startedB) return 1;

            // Maintain order or sort by name/date as secondary?
            return 0; // Stable sort preference
        });
    }, [sellables]);

    const daysRemaining = (iso?: string | null) => {
        if (!iso) return 0;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 0;
        const now = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        return Math.ceil((d.getTime() - now.getTime()) / msPerDay);
    };

    const sellPeriodMessage = (
        startIso?: string | null,
        endIso?: string | null,
    ) => {
        const start = startIso ? new Date(startIso) : null;
        const end = endIso ? new Date(endIso) : null;
        const now = new Date();
        if (!start && !end) return 'Always available';

        if (start && now.getTime() < start.getTime()) {
            const days = daysRemaining(startIso);
            return `Sale starts in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        if (end && now.getTime() > end.getTime()) {
            return 'Sale ended';
        }
        if (end && now.getTime() <= end.getTime()) {
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
                                    <div className="line-clamp-1 text-xs text-muted-foreground">
                                        {item.description}
                                    </div>
                                )}
                            </div>
                            <div className="ml-2 flex flex-col items-end text-sm">
                                <div className="font-medium text-muted-foreground">
                                    {item.type === 'product'
                                        ? `€${Number(item.price || 0).toFixed(2)}`
                                        : `€${Number(item.price_with_card || item.price || 0).toFixed(2)} / €${Number(item.price_without_card || 0).toFixed(2)}`}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {item.type === 'event'
                                        ? sellPeriodMessage(
                                            item.start_sell_date,
                                            item.end_sell_date,
                                        )
                                        : ''}
                                </div>
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
