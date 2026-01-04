import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { OnlineSale } from '@/types/sellables';

interface LatestCardSalesListProps {
    loading: boolean;
    onlineSales: OnlineSale[];
    visibleOnlineSales: OnlineSale[];
    onlinePage: number;
    setOnlinePage: (page: number | ((prev: number) => number)) => void;
    totalOnlinePages: number;
}

export function LatestCardSalesList({
    loading,
    onlineSales,
    visibleOnlineSales,
    onlinePage,
    setOnlinePage,
    totalOnlinePages,
}: LatestCardSalesListProps) {
    const formatDateTime = (iso?: string | null) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return 'N/A';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    };

    return (
        <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <h2 className="mb-4 text-lg font-semibold">
                Latest Card Sales{' '}
                {onlineSales.length > 0 ? (
                    <span className="text-muted-foreground">
                        | {visibleOnlineSales.length}
                    </span>
                ) : (
                    ''
                )}
            </h2>
            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <div className="space-y-4">
                    {/* Limit to the 10 most recent sales and make the list vertically scrollable */}
                    {onlineSales.length > 0 ? (
                        <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                            {visibleOnlineSales.map((sale: any) => (
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
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {formatDateTime(sale.sold_at)}
                                        </p>
                                    </div>
                                    <div className="text-lg font-medium">
                                        €{sale.amount}
                                    </div>
                                </div>
                            ))}
                            {/* Pagination controls when there are multiple pages */}
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
