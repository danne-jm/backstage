import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { LastShiftSummary } from '@/components/office/last-shift-summary';
import { SellablesList } from '@/components/office/sellables-list';
import { OfficeShiftStatus } from '@/components/office/office-shift-status';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office',
        href: '/office',
    },
];

export default function Office() {
    const { props: initialProps } = usePage<any>();
    // Cast to any since we are expecting these from backend potentially, or default to null/empty
    const props = initialProps as any;
    const canCreate = true;

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const products: any[] = Array.isArray(props['products']) ? props['products'] : [];
    const sellables: any[] = Array.isArray(props['sellables']) ? props['sellables'] : [];

    const now = new Date();

    const productItems = (products || [])
        .slice()
        .sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0));

    const eventItemsRaw = (sellables || []).filter((s: any) => s.type === 'event');
    const eventItems = eventItemsRaw.filter((e: any) => {
        if (!e.end_sell_date) return true;
        const end = new Date(e.end_sell_date);
        if (isNaN(end.getTime())) return true;
        return end.getTime() >= now.getTime();
    });

    const activeEvents = eventItems
        .filter((e: any) => {
            const start = e.start_sell_date ? new Date(e.start_sell_date) : null;
            const end = e.end_sell_date ? new Date(e.end_sell_date) : null;
            if (start && now.getTime() < start.getTime()) return false;
            if (end && now.getTime() > end.getTime()) return false;
            return true;
        })
        .sort((a: any, b: any) => new Date(a.end_sell_date).getTime() - new Date(b.end_sell_date).getTime());

    const upcomingEvents = eventItems
        .filter((e: any) => {
            if (!e.start_sell_date) return false;
            const start = new Date(e.start_sell_date);
            return !isNaN(start.getTime()) && start.getTime() > now.getTime();
        })
        .sort((a: any, b: any) => new Date(a.start_sell_date).getTime() - new Date(b.start_sell_date).getTime());

    const orderedSellables = [
        ...productItems.map((p: any) => ({
            ...p,
            type: 'product',
            id: `product_${p.id}`,
        })),
        ...activeEvents,
        ...upcomingEvents,
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <LastShiftSummary lastShift={lastShift} className="h-full min-h-[20rem]" />
                    <SellablesList sellables={orderedSellables} className="h-full min-h-[20rem]" />
                    <OfficeShiftStatus
                        activeShift={activeShift}
                        className="h-full min-h-[20rem]"
                        canCreate={canCreate}
                    />
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
