import { PlaceholderPattern } from '@/Components/Shared/ui/placeholder-pattern';
import { OnlineSale, Sellable } from '@/types/sellables';

interface SalesChartProps {
    loading: boolean;
    sales: Array<{ date: string; office_total: number; online_total: number }>;
    onlineSales: OnlineSale[];
    onlineSellableTotals: Array<Sellable & { total: number; count: number }>;
    onlineSellableSeries: Array<
        Sellable & {
            total: number;
            count: number;
            series: number[];
            color: string;
        }
    >;
    sellableCounts: Array<{
        id: number;
        type: 'product' | 'event';
        name: string;
        count: number;
    }>;
    seriesMax: number;
}

export function SalesChart({
    loading,
    sales,
    onlineSellableTotals,
    onlineSellableSeries,
    seriesMax,
}: SalesChartProps) {
    // Sort by count (quantity) descending
    const sortedTotals = [...onlineSellableTotals].sort(
        (a, b) => b.count - a.count,
    );

    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sales</h3>
                <div className="text-sm font-medium">
                    €
                    {onlineSellableTotals
                        .reduce((acc, s) => acc + (s.total || 0), 0)
                        .toFixed(2)}
                </div>
            </div>
            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <>
                    <div className="h-40 w-full">
                        <svg viewBox="0 0 300 80" className="h-full w-full">
                            {(() => {
                                if (!sales || sales.length === 0) return null;
                                const pad = 10;
                                const w = 300 - pad * 2;
                                const h = 80 - pad * 2;
                                const dateKeys = sales.map((s) => s.date);

                                return (
                                    <>
                                        {onlineSellableSeries.map((s, idx) => {
                                            const points = s.series.map(
                                                (val: number, i: number) => {
                                                    const x =
                                                        pad +
                                                        (i /
                                                            Math.max(
                                                                1,
                                                                dateKeys.length -
                                                                    1,
                                                            )) *
                                                            w;
                                                    const y =
                                                        pad +
                                                        h -
                                                        (val / seriesMax) * h;
                                                    return { x, y };
                                                },
                                            );

                                            const d = points
                                                .map(
                                                    (p, i) =>
                                                        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                                                )
                                                .join(' ');

                                            return (
                                                <path
                                                    key={`series-${idx}`}
                                                    d={d}
                                                    fill="none"
                                                    stroke={s.color}
                                                    strokeWidth={2}
                                                    strokeOpacity={0.95}
                                                />
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </svg>
                    </div>
                    <div className="mt-3 text-xs">
                        <div className="mb-1 text-muted-foreground">
                            Active online sellables
                        </div>
                        <div className="space-y-1">
                            {sortedTotals.length > 0 ? (
                                sortedTotals.map((s) => {
                                    const total = s.total || 0;
                                    const overall =
                                        sortedTotals.reduce(
                                            (a, it) => a + (it.total || 0),
                                            0,
                                        ) || 0;
                                    const pct =
                                        overall === 0
                                            ? 0
                                            : (total / overall) * 100;
                                    const seriesMeta =
                                        onlineSellableSeries.find(
                                            (ss) =>
                                                ss.id === s.id &&
                                                (ss.type as any) === s.type,
                                        );
                                    const color =
                                        seriesMeta?.color ?? '#6B7280';
                                    const count = s.count ?? 0;

                                    return (
                                        <div
                                            key={`online-sellable-${s.type}-${s.id}`}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span
                                                    className="inline-block h-2 w-2 rounded-full"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                                <span className="flex items-baseline gap-2">
                                                    <span>{s.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        x {count}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <div className="font-medium">
                                                    €{total.toFixed(2)}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {pct.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted-foreground">
                                    No active online sellables
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
