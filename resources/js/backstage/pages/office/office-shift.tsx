import { Head, usePage } from '@inertiajs/react';
import { RevenueCard } from '@backstage/components/office/revenue-card';
import { SalesLogCard } from '@backstage/components/office/sales-log-card';
import { ShiftActionsCard } from '@backstage/components/office/shift-actions-card';
import { WorkersCard } from '@backstage/components/office/workers-card';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';

export default function Show() {
    const { props } = usePage<any>();

    const activeShift: any = props.activeShift ?? null;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Office',
            href: '/office',
        },
        {
            title:
                activeShift?.status === 'open'
                    ? 'Active Shift'
                    : `Closed Shift #${activeShift?.id || props.shiftId}`,
            href: '#',
        },
    ];

    const workers: any[] = Array.isArray(props.workers) ? props.workers : [];
    const sales: any[] = Array.isArray(props.sales) ? props.sales : [];
    const onlineSales: any[] = Array.isArray(props.onlineSales) ? props.onlineSales : [];
    const sellables: any[] = Array.isArray(props.sellables)
        ? props.sellables
        : [];
    const staff: any[] = Array.isArray(props.staff) ? props.staff : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office Shift" />
            <div className="flex flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <WorkersCard
                        workers={workers}
                        activeShift={activeShift}
                        staff={staff}
                    />
                    <RevenueCard activeShift={activeShift} />
                    <ShiftActionsCard
                        activeShift={activeShift}
                        sellables={sellables}
                    />
                </div>
                <div className="w-full flex-1">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <SalesLogCard sales={sales} onlineSales={onlineSales} activeShift={activeShift} sellables={sellables} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
