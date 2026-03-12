import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import type { OnlineSale } from '@/types/sellables';

export type TimePeriod = '24hours' | '7days' | '14days' | 'month' | 'lastShift';

export const PERIOD_LABELS: Record<TimePeriod, string> = {
    '24hours': 'Last 24 hours',
    '7days': 'Last 7 days',
    '14days': 'Last 14 days',
    month: 'Last 30 days',
    lastShift: 'Since last shift',
};

export interface LatestCardSalesListProps {
    loading: boolean;
    onlineSales: OnlineSale[];
    visibleOnlineSales: OnlineSale[];
    onlinePage: number;
    setOnlinePage: (page: number | ((prev: number) => number)) => void;
    totalOnlinePages: number;
    period: TimePeriod;
    setPeriod: (period: TimePeriod) => void;
    periodLabels?: Record<TimePeriod, string>;
}

function formatDateTime(iso?: string | null): string {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'N/A';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

export function LatestCardSalesList({
    loading,
    onlineSales,
    visibleOnlineSales,
    onlinePage,
    setOnlinePage,
    totalOnlinePages,
    period,
    setPeriod,
    periodLabels = PERIOD_LABELS,
}: LatestCardSalesListProps) {
    return (
        <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-3 sm:p-4 dark:border-sidebar-border">
            {/* Header row */}
            <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold sm:text-lg">
                    Latest Online Sales{' '}
                    {onlineSales.length > 0 && (
                        <span className="text-muted-foreground">
                            | {visibleOnlineSales.length}
                        </span>
                    )}
                </h2>

                {/* Period selector */}
                <div className="flex overflow-x-auto overflow-y-hidden rounded-md border border-sidebar-border/70">
                    {(
                        [
                            '24hours',
                            '7days',
                            '14days',
                            'month',
                            'lastShift',
                        ] as TimePeriod[]
                    ).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-2 py-1 text-xs whitespace-nowrap transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${
                                period === p
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background hover:bg-muted'
                            }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <div className="space-y-4">
                    {onlineSales.length > 0 ? (
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                            {visibleOnlineSales.map((sale) => {
                                const hasVariants =
                                    sale.details?.options &&
                                    Object.keys(sale.details.options).length >
                                        0;
                                const hasEsnCardDiscount =
                                    sale.details?.code_used &&
                                    sale.ticket_type === 'with_card';

                                return (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div>
                                            <h3 className="font-medium">
                                                {sale.product?.name ||
                                                    sale.event?.name ||
                                                    'Unknown Item'}
                                            </h3>
                                            {hasVariants && (
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    {Object.entries(
                                                        sale.details!.options!,
                                                    )
                                                        .map(
                                                            ([k, v]) =>
                                                                `${k}: ${v}`,
                                                        )
                                                        .join(', ')}
                                                </p>
                                            )}
                                            {hasEsnCardDiscount && (
                                                <p className="mt-0.5 text-sm text-muted-foreground">
                                                    With ESNcard
                                                </p>
                                            )}
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {formatDateTime(sale.sold_at)}
                                            </p>
                                        </div>
                                        <div className="text-lg font-medium">
                                            €{sale.amount}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {totalOnlinePages > 1 && (
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Page {onlinePage} of {totalOnlinePages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="rounded border bg-background/40 px-2 py-1 text-sm disabled:opacity-40"
                                            disabled={onlinePage <= 1}
                                            onClick={() =>
                                                setOnlinePage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            Prev
                                        </button>
                                        <button
                                            className="rounded border bg-background/40 px-2 py-1 text-sm disabled:opacity-40"
                                            disabled={
                                                onlinePage >= totalOnlinePages
                                            }
                                            onClick={() =>
                                                setOnlinePage((p) =>
                                                    Math.min(
                                                        totalOnlinePages,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No online sales yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
