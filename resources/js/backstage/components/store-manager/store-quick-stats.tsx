export interface StoreQuickStatsProps {
    totalOffice: number;
    totalOnline: number;
    onlineSellablesCount: number;
    topSellerName: string;
}

export function StoreQuickStats({
    totalOffice,
    totalOnline,
    onlineSellablesCount,
    topSellerName,
}: StoreQuickStatsProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <h3 className="mb-2 text-sm font-semibold">Quick Stats</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-md bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                        Total Office (Cash + Card)
                    </div>
                    <div className="mt-1 text-lg font-medium">
                        €{totalOffice.toFixed(2)}
                    </div>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                        Total Card
                    </div>
                    <div className="mt-1 text-lg font-medium">
                        €{totalOnline.toFixed(2)}
                    </div>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                        Online Sellables
                    </div>
                    <div className="mt-1 text-lg font-medium">
                        {onlineSellablesCount}
                    </div>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">
                        Top Seller
                    </div>
                    <div className="mt-1 text-lg font-medium">
                        {topSellerName}
                    </div>
                </div>
            </div>
        </div>
    );
}
