import { Head, Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@backstage/components/ui/button';
import { EventDialog } from '@backstage/components/sellables/event-dialog';
import { ProductDialog } from '@backstage/components/sellables/product-dialog';
import { Alert, AlertTitle } from '@backstage/components/ui/alert';
import {
    LatestCardSalesList,
    PERIOD_LABELS,
} from '@backstage/components/store-manager/latest-card-sales-list';
import { SalesChart } from '@backstage/components/store-manager/sales-chart';
import { SellablesPanel } from '@backstage/components/store-manager/sellables-panel';
import { useStoreManager } from '@backstage/hooks/use-store-manager';
import AppLayout from '@backstage/layouts/app-layout';
import { storeManager } from '@backstage/routes';
import type { BreadcrumbItem } from '@backstage/types';
import type { Event, Product } from '@backstage/types/sellables';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Store Manager',
        href: storeManager.url(),
    },
];

export default function StoreManager() {
    // ── Data ─────────────────────────────────────────────────────────────────
    const {
        loading,
        sellables,
        boardUsers,
        sales,
        onlineSales,
        officeSales,
        totalOffice,
        totalOnline,
        onlineSellableTotals,
        onlineSellableSeries,
        sellableCounts,
        onlineSellablesCount,
        totalOnlinePages,
        visibleOnlineSales,
        period,
        setPeriod,
        onlinePage,
        setOnlinePage,
        handleSetOnline,
        message,
        setMessage,
        reload,
    } = useStoreManager();

    // ── Dialog state ─────────────────────────────────────────────────────────
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const openProductDialog = (product?: Product) => {
        setEditingProduct(product ?? null);
        setProductDialogOpen(true);
    };

    const openEventDialog = (event?: Event) => {
        setEditingEvent(event ?? null);
        setEventDialogOpen(true);
    };

    const headerActions = (
        <Link href="/store-manager/all-sales">
            <Button variant="outline" size="sm">All Sales</Button>
        </Link>
    );

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
                <Head title="Store Manager" />

                <div className="flex flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    {/* Top row: Sales Chart + Sellables */}
                    <div className="grid h-120 grid-cols-1 gap-4 overflow-hidden md:grid-cols-3">
                        {/* Sales chart — spans 2 columns */}
                        <div className="h-full overflow-hidden md:col-span-2">
                            <SalesChart
                                loading={loading}
                                sales={sales}
                                onlineSales={onlineSales}
                                officeSales={officeSales}
                                onlineSellableTotals={onlineSellableTotals}
                                onlineSellableSeries={onlineSellableSeries}
                                sellableCounts={sellableCounts}
                                totalOffice={totalOffice}
                                totalOnline={totalOnline}
                                onlineSellablesCount={onlineSellablesCount}
                                topSellerName={
                                    onlineSellableTotals[0]?.name ?? '—'
                                }
                            />
                        </div>

                        {/* Sellables panel */}
                        <SellablesPanel
                            sellables={sellables}
                            loading={loading}
                            onlineSellablesCount={onlineSellablesCount}
                            onEditProduct={openProductDialog}
                            onEditEvent={openEventDialog}
                            onSetOnline={handleSetOnline}
                        />
                    </div>

                    {/* Latest Online Sales */}
                    <LatestCardSalesList
                        loading={loading}
                        onlineSales={onlineSales}
                        visibleOnlineSales={visibleOnlineSales}
                        onlinePage={onlinePage}
                        setOnlinePage={setOnlinePage}
                        totalOnlinePages={totalOnlinePages}
                        period={period}
                        setPeriod={setPeriod}
                        periodLabels={PERIOD_LABELS}
                    />
                </div>
            </AppLayout>

            {/* Dialogs */}
            <ProductDialog
                open={productDialogOpen}
                onOpenChange={setProductDialogOpen}
                editingProduct={editingProduct}
                preserveState={true}
                onSuccess={() => {
                    reload(onlinePage, 100);
                }}
            />
            <EventDialog
                open={eventDialogOpen}
                onOpenChange={setEventDialogOpen}
                editingEvent={editingEvent}
                boardUsers={boardUsers}
                preserveState={true}
                onSuccess={() => {
                    reload(onlinePage, 100);
                }}
            />

            {message && (
                <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                    <Alert>
                        <Check />
                        <AlertTitle>{message}</AlertTitle>
                    </Alert>
                </div>
            )}
        </>
    );
}
