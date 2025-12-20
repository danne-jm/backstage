import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { office } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office',
        href: office().url,
    },
];

export default function Office() {
    const props = usePage<SharedData>().props;

    const activeShift: any = props['activeShift'] ?? null;
    const lastShift: any = props['lastShift'] ?? null;
    const products: any[] = Array.isArray(props['products'])
        ? props['products']
        : [];
    const pastShifts: any[] = Array.isArray(props['pastShifts'])
        ? props['pastShifts']
        : [];

    const [message, setMessage] = React.useState('');

    // auto-dismiss messages
    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    const formatTimestamp = (iso?: string | null) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Poll overview data so status, products and last shift update (every 2s)
    React.useEffect(() => {
        const interval = setInterval(() => {
            router.get(
                office().url,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [
                        'activeShift',
                        'lastShift',
                        'products',
                        'pastShifts',
                    ],
                },
            );
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Filter pastShifts client-side to exclude the activeShift and the lastShift
    const filteredPastShifts = (pastShifts || []).filter(
        (s: any) => s.id !== lastShift?.id && s.id !== activeShift?.id,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
                    <section className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">
                                Last Office Shift
                            </h3>
                            {lastShift ? (
                                <Link href={`/office/${lastShift.id}`}>
                                    <Button size="sm" variant="ghost">
                                        Review
                                    </Button>
                                </Link>
                            ) : null}
                        </div>
                        {lastShift ? (
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Started
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatTimestamp(lastShift.started_at)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Ended
                                    </div>
                                    <div className="text-sm font-medium">
                                        {formatTimestamp(lastShift.ended_at)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Workers
                                    </div>
                                    <div className="text-sm">
                                        {Array.isArray(lastShift.workers) &&
                                        lastShift.workers.length > 0
                                            ? lastShift.workers
                                                  .map((w: any) => w.name)
                                                  .join(', ')
                                            : 'None'}
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">
                                        Start Money
                                    </div>
                                    <div className="mt-1 flex justify-between text-sm">
                                        <span>Cash:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.start_cash ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Card:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.start_card ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-xs text-muted-foreground">
                                        End of Shift Money
                                    </div>
                                    <div className="mt-1 flex justify-between text-sm">
                                        <span>Cash:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.total_cash ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Card:</span>
                                        <span className="font-medium">
                                            €
                                            {Number(
                                                lastShift.total_card ?? 0,
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                                        <span>Total:</span>
                                        <span>
                                            €
                                            {(
                                                Number(
                                                    lastShift.total_cash ?? 0,
                                                ) +
                                                Number(
                                                    lastShift.total_card ?? 0,
                                                )
                                            ).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                No office shifts available
                            </div>
                        )}
                    </section>

                    <section className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="mb-3 text-sm font-semibold">
                            Sellable Products
                        </h3>
                        <div className="flex-1 space-y-2 overflow-y-auto">
                            {products.length > 0 ? (
                                products.map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                                    >
                                        <div className="text-sm font-medium">
                                            {product.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            €{Number(product.price).toFixed(2)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No products available
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="flex h-full flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="mb-3 text-sm font-semibold">
                            Office Shift Status
                        </h3>
                        {activeShift ? (
                            <div className="space-y-3">
                                <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                                    <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                                        Active Shift in Progress
                                    </div>
                                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        Started:{' '}
                                        {formatTimestamp(
                                            activeShift.started_at,
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">
                                        Current Workers
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {Array.isArray(activeShift.workers) &&
                                        activeShift.workers.length > 0
                                            ? activeShift.workers
                                                  .map((w: any) => w.name)
                                                  .join(', ')
                                            : 'None'}
                                    </div>
                                </div>
                                <Link href={`/office/${activeShift.id}`}>
                                    <Button
                                        className="w-full"
                                        variant="default"
                                    >
                                        Manage Active Shift
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-md bg-muted/40 p-3">
                                    <div className="text-sm font-medium">
                                        No Active Shift
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Start a new shift to begin tracking
                                        sales and workers
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    variant="default"
                                    onClick={() => {
                                        router.post(
                                            '/office/start',
                                            {},
                                            {
                                                onSuccess: () => {
                                                    setTimeout(
                                                        () => router.reload(),
                                                        300,
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    Start Office Shift
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert>
                            <Check />
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">
                        Previous Shift Sales Log
                    </h3>

                    {lastShift &&
                    Array.isArray(lastShift.sales) &&
                    lastShift.sales.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-muted-foreground">
                                        <th className="w-1/12">#</th>
                                        <th className="w-4/12">Item</th>
                                        <th className="w-2/12">Method</th>
                                        <th className="w-2/12">Amount</th>
                                        <th className="w-3/12">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="mt-2">
                                    {lastShift.sales.map((sale: any) => (
                                        <tr
                                            key={String(sale.id)}
                                            className="border-t"
                                        >
                                            <td className="py-3">{sale.id}</td>
                                            <td className="py-3">
                                                {sale.name ?? 'N/A'}
                                            </td>
                                            <td className="py-3 capitalize">
                                                {sale.method}
                                            </td>
                                            <td className="py-3">
                                                €
                                                {Number(
                                                    sale.amount ?? 0,
                                                ).toFixed(2)}
                                            </td>
                                            <td className="py-3">
                                                {sale.description ?? ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="mt-6 flex justify-end gap-4">
                                <div className="text-sm">
                                    <div className="text-muted-foreground">
                                        Cash
                                    </div>
                                    <div className="font-medium">
                                        €
                                        {lastShift.sales
                                            .filter(
                                                (s: any) =>
                                                    String(
                                                        s.method,
                                                    ).toLowerCase() === 'cash',
                                            )
                                            .reduce(
                                                (sum: number, s: any) =>
                                                    sum + Number(s.amount ?? 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </div>
                                </div>

                                <div className="text-sm">
                                    <div className="text-muted-foreground">
                                        Card
                                    </div>
                                    <div className="font-medium">
                                        €
                                        {lastShift.sales
                                            .filter(
                                                (s: any) =>
                                                    String(
                                                        s.method,
                                                    ).toLowerCase() === 'card',
                                            )
                                            .reduce(
                                                (sum: number, s: any) =>
                                                    sum + Number(s.amount ?? 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </div>
                                </div>

                                <div className="text-sm">
                                    <div className="text-muted-foreground">
                                        Total
                                    </div>
                                    <div className="font-semibold">
                                        €
                                        {lastShift.sales
                                            .reduce(
                                                (sum: number, s: any) =>
                                                    sum + Number(s.amount ?? 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No sales data from previous shift
                        </div>
                    )}
                </div>

                {/* Historical shifts list (older than lastShift) */}
                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">
                        All Office Shifts
                    </h3>

                    {filteredPastShifts && filteredPastShifts.length > 0 ? (
                        <div className="space-y-3">
                            {filteredPastShifts.map((s: any) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between rounded-md bg-muted/40 p-3"
                                >
                                    <div>
                                        <div className="text-sm font-medium">
                                            {formatTimestamp(s.started_at)} —{' '}
                                            {formatTimestamp(s.ended_at)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {Array.isArray(s.workers) &&
                                            s.workers.length > 0
                                                ? s.workers
                                                      .map((w: any) => w.name)
                                                      .slice(0, 3)
                                                      .join(', ')
                                                : 'No workers'}
                                            {Array.isArray(s.workers) &&
                                            s.workers.length > 3
                                                ? ` +${s.workers.length - 3} more`
                                                : ''}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-sm text-muted-foreground">
                                            €
                                            {(
                                                Number(s.total_cash ?? 0) +
                                                Number(s.total_card ?? 0)
                                            ).toFixed(2)}
                                        </div>

                                        <Link href={`/office/${s.id}`}>
                                            <Button size="sm" variant="ghost">
                                                Review
                                            </Button>
                                        </Link>

                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:bg-muted/30"
                                                >
                                                    Remove
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogTitle>
                                                    Delete this office shift?
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Deleting a shift will
                                                    permanently remove its sales
                                                    and worker history. This
                                                    action cannot be undone. Are
                                                    you sure?
                                                </DialogDescription>
                                                <DialogFooter className="gap-2">
                                                    <DialogClose asChild>
                                                        <Button variant="secondary">
                                                            Cancel
                                                        </Button>
                                                    </DialogClose>

                                                    <DialogClose asChild>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => {
                                                                router.post(
                                                                    `/office/${s.id}/delete`,
                                                                    {},
                                                                    {
                                                                        onStart:
                                                                            () => {},
                                                                        onSuccess:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Shift deleted',
                                                                                );
                                                                                setTimeout(
                                                                                    () =>
                                                                                        router.reload(),
                                                                                    500,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () =>
                                                                                setMessage(
                                                                                    'Failed to delete shift',
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No office shifts available
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
