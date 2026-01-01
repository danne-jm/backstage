import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import React from 'react';
import { cn } from '@/lib/utils';

interface SellablesListProps {
    sellables: any[];
    className?: string; // changed
}

export function SellablesList({ sellables, className }: SellablesListProps) {
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
            return `Starts in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        if (end && now.getTime() > end.getTime()) {
            return 'Sale ended';
        }
        if (end && now.getTime() <= end.getTime()) {
            const days = daysRemaining(endIso);
            return `Ends in ${days} ${days === 1 ? 'day' : 'days'}`;
        }
        return 'Available';
    };

    return (
        <section
            className={cn(
                "flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border",
                className
            )}
        >
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sellables</h3>
                <Link href="/sellables">
                    <Button size="sm" variant="ghost">
                        Manage
                    </Button>
                </Link>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {sellables.length > 0 ? (
                    sellables.map((item: any) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                        >
                            <div className="flex-1">
                                <div className="text-sm font-medium">
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
                                        ? `€${Number(item.price).toFixed(2)}`
                                        : `€${Number(item.price_with_card).toFixed(2)} / €${Number(item.price_without_card).toFixed(2)}`}
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
        </section>
    );
}
