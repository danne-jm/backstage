import { LastShiftSummary } from '@/components/office/LastShiftSummary';
import { OfficeShiftStatus } from '@/components/office/OfficeShiftStatus';
import { PastShiftsList } from '@/components/office/PastShiftsList';
import { PreviousShiftSalesLog } from '@/components/office/PreviousShiftSalesLog';
import { SellablesList } from '@/components/office/SellablesList';
import { Alert, AlertTitle } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Check } from 'lucide-react';
import * as React from 'react';
import useSWR from 'swr';
import { route } from 'ziggy-js';

export default function Office() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Office',
            href: route('office'),
        },
    ];

    const { props: initialProps, version } = usePage<SharedData>();
    const [props, setProps] = React.useState(initialProps);
    // Cast to any to avoid type errors since auth is guaranteed by middleware but maybe missing in SharedData type
    const { auth } = initialProps as any;
    const permissions = auth?.user?.permissions || [];
    const canCreate =
        permissions.includes('admin') || permissions.includes('create_office');
    const canDelete =
        permissions.includes('admin') || permissions.includes('delete_office');

    const fetcher = (url: string) =>
        axios
            .get(url, {
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': version,
                },
            })
            .then((res) => res.data);

    useSWR(route('office'), fetcher, {
        refreshInterval: 2000,
        onSuccess: (newData) => {
            if (newData?.props) {
                setProps(newData.props);
            }
        },
    });

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const products: any[] = Array.isArray(props['products'])
        ? props['products']
        : [];
    const sellables: any[] = Array.isArray(props['sellables'])
        ? props['sellables']
        : [];
    const pastShifts: any[] = Array.isArray(props['pastShifts'])
        ? props['pastShifts']
        : [];
    const staffRaw = props['staff'];
    const staff: any[] = React.useMemo(
        () => (Array.isArray(staffRaw) ? staffRaw : []),
        [staffRaw],
    );
    const now = new Date();

    const staffMap = React.useMemo(
        () => new Map(staff.map((s) => [s.email, s.name])),
        [staff],
    );

    const productItems = (products || [])
        .slice()
        .sort(
            (a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0),
        );

    const eventItemsRaw = (sellables || []).filter(
        (s: any) => s.type === 'event',
    );
    const eventItems = eventItemsRaw.filter((e: any) => {
        if (!e.end_sell_date) return true;
        const end = new Date(e.end_sell_date);
        if (isNaN(end.getTime())) return true;
        return end.getTime() >= now.getTime();
    });

    const activeEvents = eventItems
        .filter((e: any) => {
            const start = e.start_sell_date
                ? new Date(e.start_sell_date)
                : null;
            const end = e.end_sell_date ? new Date(e.end_sell_date) : null;
            if (start && now.getTime() < start.getTime()) return false;
            if (end && now.getTime() > end.getTime()) return false;
            return true;
        })
        .sort(
            (a: any, b: any) =>
                new Date(a.end_sell_date).getTime() -
                new Date(b.end_sell_date).getTime(),
        );

    const upcomingEvents = eventItems
        .filter((e: any) => {
            if (!e.start_sell_date) return false;
            const start = new Date(e.start_sell_date);
            return !isNaN(start.getTime()) && start.getTime() > now.getTime();
        })
        .sort(
            (a: any, b: any) =>
                new Date(a.start_sell_date).getTime() -
                new Date(b.start_sell_date).getTime(),
        );

    const orderedSellables = [
        ...productItems.map((p: any) => ({
            ...p,
            type: 'product',
            id: `product_${p.id}`,
        })),
        ...activeEvents,
        ...upcomingEvents,
    ];

    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    const filteredPastShifts = (pastShifts || []).filter(
        (s: any) => s.id !== lastShift?.id && s.id !== activeShift?.id,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <LastShiftSummary
                        lastShift={lastShift}
                        className="h-full min-h-[20rem]"
                    />
                    <SellablesList
                        sellables={orderedSellables}
                        className="h-full min-h-[20rem]"
                    />
                    <OfficeShiftStatus
                        activeShift={activeShift}
                        className="h-full min-h-[20rem]"
                        canCreate={canCreate}
                    />
                </div>
                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert>
                            <Check />
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                <PreviousShiftSalesLog
                    lastShift={lastShift}
                    staffMap={staffMap}
                />

                <PastShiftsList
                    shifts={filteredPastShifts}
                    setMessage={setMessage}
                    canDelete={canDelete}
                />
            </div>
        </AppLayout>
    );
}
