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
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { office } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Pencil } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Office Shifts',
        href: office().url,
    },
];

// We'll rely on server-provided staff and activeShift.sales/workers — no client-side sample data

export default function Office() {
    const props = usePage<SharedData>().props;

    // Build staff list from server props and mark those on shift.
    const products: any[] = Array.isArray(props['products'])
        ? (props['products'] as any[]).map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
          }))
        : [];
    const activeShift: any = props['activeShift'] ?? null;
    const previousTotals: any = props['previousTotals'] ?? {
        cash: 0,
        card: 0,
        combined: 0,
    };

    const [workers, setWorkers] = React.useState<any[]>([]);
    const [sales, setSales] = React.useState<any[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    // auto-dismiss messages
    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    React.useEffect(() => {
        const active: any = props['activeShift'] ?? null;
        setWorkers(Array.isArray(active?.workers) ? active.workers : []);
        setSales(Array.isArray(active?.sales) ? active.sales : []);
    }, [props['activeShift']]);

    // Poll active shift data (workers, sales, totals) every 2s so UI stays in sync
    React.useEffect(() => {
        if (!activeShift) return undefined;

        const interval = setInterval(() => {
            // Partial Inertia visit to refresh only the props we care about.
            // preserveState prevents losing any local UI state while updating props.
            // preserveScroll keeps the user's scroll position intact during polling.
            router.get(
                `/office/${activeShift.id}`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    only: [
                        'activeShift',
                        'previousTotals',
                        'staff',
                        'products',
                    ],
                },
            );
        }, 2000);

        return () => clearInterval(interval);
    }, [activeShift?.id]);

    // staff list annotated with whether they are currently on shift
    const staffData = (Array.isArray(props['staff']) ? props['staff'] : []).map(
        (m: any) => ({
            id: m.id,
            name: String(m.name || ''),
            role: String(m.role ?? ''),
            email: String(m.email ?? ''),
            onShift: Boolean((workers || []).find((w: any) => w.id === m.id)),
        }),
    );

    // sort so workers appear first
    staffData.sort((a: any, b: any) => {
        if (a.onShift === b.onShift) return a.name.localeCompare(b.name);
        return a.onShift ? -1 : 1;
    });

    // Quick-add Sale form state
    const [saleProductId, setSaleProductId] = React.useState<number | null>(
        products.length ? products[0].id : null,
    );
    const [saleMethod, setSaleMethod] = React.useState<'Cash' | 'Card'>('Cash');
    // saleAmount and saleDescription removed (unused) to satisfy linter

    // Custom sale form state (separate from quick-add)
    const [customProductId, setCustomProductId] = React.useState<number | null>(
        products.length ? products[0].id : null,
    );
    // customMethod removed (unused) to satisfy linter
    const [customAmount, setCustomAmount] = React.useState('');
    const [customDescription, setCustomDescription] = React.useState('');

    const cashTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'cash')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const cardTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'card')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const combinedTotal = cashTotal + cardTotal;

    // Revenue editable states
    // start totals are editable client-side (with pencil icon), last totals are not
    const [startTotals, setStartTotals] = React.useState<{
        cash: number;
        card: number;
    }>({
        cash: Number(activeShift?.start_cash ?? 0),
        card: Number(activeShift?.start_card ?? 0),
    });
    // editing state for start of shift
    const [editingStart, setEditingStart] = React.useState<{
        cash: boolean;
        card: boolean;
    }>({ cash: false, card: false });
    const [pendingStart, setPendingStart] = React.useState<{
        cash: number;
        card: number;
    } | null>(null);
    const [lastTotals] = React.useState<{ cash: number; card: number }>({
        cash: Number(previousTotals?.cash ?? 0),
        card: Number(previousTotals?.card ?? 0),
    });

    // collapsible UI state for start/last sections
    const [startCollapsed, setStartCollapsed] = React.useState<boolean>(false);
    const [lastCollapsed, setLastCollapsed] = React.useState<boolean>(false);
    const [activeCollapsed, setActiveCollapsed] =
        React.useState<boolean>(false);
    const [totalCollapsed, setTotalCollapsed] = React.useState<boolean>(false);

    // Sync start totals from polled activeShift data (unless user is editing)
    React.useEffect(() => {
        if (activeShift && !editingStart.cash && !editingStart.card) {
            setStartTotals({
                cash: Number(activeShift.start_cash ?? 0),
                card: Number(activeShift.start_card ?? 0),
            });
        }
    }, [
        activeShift?.start_cash,
        activeShift?.start_card,
        editingStart.cash,
        editingStart.card,
    ]);

    // totals including start-of-shift amounts (start + live)
    const totalCash = Number(startTotals.cash ?? 0) + cashTotal;
    const totalCard = Number(startTotals.card ?? 0) + cardTotal;
    const totalCombined = totalCash + totalCard;

    // Helpers to format shift date/title and start time
    const dayOrdinal = (n: number) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return `${n}th`;
        switch (n % 10) {
            case 1:
                return `${n}st`;
            case 2:
                return `${n}nd`;
            case 3:
                return `${n}rd`;
            default:
                return `${n}th`;
        }
    };

    const formatShiftTitle = (iso?: string | null) => {
        if (!iso) return 'Shift actions';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'Shift actions';
        const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
        const month = d.toLocaleDateString(undefined, { month: 'long' });
        const day = dayOrdinal(d.getDate());
        return `${weekday}, ${month} ${day}`;
    };

    const formatStartTime = (iso?: string | null) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Office Shifts" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert>
                            <Check />
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                {/* Top row: three summary cards */}
                <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
                    {/* Workers */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="text-sm font-semibold">Workers</h3>
                        <div className="mt-3 flex-1 overflow-y-auto">
                            <ul className="space-y-2">
                                {staffData.map((member: any) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between rounded-md bg-muted/40 p-2"
                                    >
                                        <div>
                                            <div className="text-sm font-medium">
                                                {member.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {member.role}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!member.onShift ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={
                                                        !activeShift ||
                                                        submitting
                                                    }
                                                    onClick={() => {
                                                        if (!activeShift)
                                                            return;
                                                        const newWorker = {
                                                            id: member.id,
                                                            name: member.name,
                                                            role: member.role,
                                                            email: member.email,
                                                        };
                                                        setWorkers((prev) => {
                                                            const filtered = (
                                                                prev || []
                                                            ).filter(
                                                                (w: any) =>
                                                                    w.id !==
                                                                    newWorker.id,
                                                            );
                                                            return [
                                                                newWorker,
                                                                ...filtered,
                                                            ];
                                                        });

                                                        router.post(
                                                            `/office/${activeShift.id}/add-worker`,
                                                            {
                                                                user_id:
                                                                    member.id,
                                                            },
                                                            {
                                                                onStart: () =>
                                                                    setSubmitting(
                                                                        true,
                                                                    ),
                                                                onFinish: () =>
                                                                    setSubmitting(
                                                                        false,
                                                                    ),
                                                                onSuccess: () =>
                                                                    setMessage(
                                                                        'Worker added',
                                                                    ),
                                                                onError: () => {
                                                                    setWorkers(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            (
                                                                                prev ||
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    w: any,
                                                                                ) =>
                                                                                    w.id !==
                                                                                    member.id,
                                                                            ),
                                                                    );
                                                                    setMessage(
                                                                        'Failed to add worker',
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:bg-muted/30"
                                                        disabled={submitting}
                                                        onClick={() => {
                                                            if (!activeShift)
                                                                return;
                                                            const wid =
                                                                member.id;
                                                            setWorkers((prev) =>
                                                                (
                                                                    prev || []
                                                                ).filter(
                                                                    (w: any) =>
                                                                        w.id !==
                                                                        wid,
                                                                ),
                                                            );

                                                            router.post(
                                                                `/office/${activeShift.id}/remove-worker`,
                                                                {
                                                                    user_id:
                                                                        wid,
                                                                },
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () =>
                                                                            setMessage(
                                                                                'Worker removed',
                                                                            ),
                                                                    onError:
                                                                        () => {
                                                                            setWorkers(
                                                                                (
                                                                                    prev,
                                                                                ) => {
                                                                                    const wasPresent =
                                                                                        (
                                                                                            prev ||
                                                                                            []
                                                                                        ).some(
                                                                                            (
                                                                                                w: any,
                                                                                            ) =>
                                                                                                w.id ===
                                                                                                wid,
                                                                                        );
                                                                                    if (
                                                                                        wasPresent
                                                                                    )
                                                                                        return prev;
                                                                                    return [
                                                                                        {
                                                                                            id: member.id,
                                                                                            name: member.name,
                                                                                            role: member.role,
                                                                                            email: member.email,
                                                                                        },
                                                                                        ...(prev ||
                                                                                            []),
                                                                                    ];
                                                                                },
                                                                            );
                                                                            setMessage(
                                                                                'Failed to remove worker',
                                                                            );
                                                                        },
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>

                                                    <div className="text-sm text-neutral-600">
                                                        On shift
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Revenue */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="text-sm font-semibold">Revenue</h3>
                        <div className="mt-4 space-y-3">
                            {/* Start of shift (editable) */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Start of shift
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setStartCollapsed((s) => !s)
                                        }
                                    >
                                        {startCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!startCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingStart.cash ? (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32"
                                                            value={String(
                                                                pendingStart?.cash ??
                                                                    startTotals.cash,
                                                            )}
                                                            onChange={(e) =>
                                                                setPendingStart(
                                                                    (prev) => ({
                                                                        ...(prev ??
                                                                            startTotals),
                                                                        cash: Number(
                                                                            e
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (
                                                                    !activeShift
                                                                )
                                                                    return;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                const newCash =
                                                                    pendingStart?.cash ??
                                                                    startTotals.cash;
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: newCash,
                                                                        card: startTotals.card,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setStartTotals(
                                                                                    (
                                                                                        s,
                                                                                    ) => ({
                                                                                        ...s,
                                                                                        cash: newCash,
                                                                                    }),
                                                                                );
                                                                                setMessage(
                                                                                    'Start cash updated',
                                                                                );
                                                                                setEditingStart(
                                                                                    (
                                                                                        e,
                                                                                    ) => ({
                                                                                        ...e,
                                                                                        cash: false,
                                                                                    }),
                                                                                );
                                                                                setPendingStart(
                                                                                    null,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start cash',
                                                                                );
                                                                            },
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        cash: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-lg font-medium">
                                                            €
                                                            {Number(
                                                                startTotals.cash,
                                                            ).toFixed(2)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        cash: true,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingStart.card ? (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            className="w-32"
                                                            value={String(
                                                                pendingStart?.card ??
                                                                    startTotals.card,
                                                            )}
                                                            onChange={(e) =>
                                                                setPendingStart(
                                                                    (prev) => ({
                                                                        ...(prev ??
                                                                            startTotals),
                                                                        card: Number(
                                                                            e
                                                                                .target
                                                                                .value ||
                                                                                0,
                                                                        ),
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                if (
                                                                    !activeShift
                                                                )
                                                                    return;
                                                                setSubmitting(
                                                                    true,
                                                                );
                                                                const newCard =
                                                                    pendingStart?.card ??
                                                                    startTotals.card;
                                                                router.post(
                                                                    `/office/${activeShift.id}/update-start-totals`,
                                                                    {
                                                                        cash: startTotals.cash,
                                                                        card: newCard,
                                                                    },
                                                                    {
                                                                        onSuccess:
                                                                            () => {
                                                                                setStartTotals(
                                                                                    (
                                                                                        s,
                                                                                    ) => ({
                                                                                        ...s,
                                                                                        card: newCard,
                                                                                    }),
                                                                                );
                                                                                setMessage(
                                                                                    'Start card updated',
                                                                                );
                                                                                setEditingStart(
                                                                                    (
                                                                                        e,
                                                                                    ) => ({
                                                                                        ...e,
                                                                                        card: false,
                                                                                    }),
                                                                                );
                                                                                setPendingStart(
                                                                                    null,
                                                                                );
                                                                            },
                                                                        onError:
                                                                            () => {
                                                                                setMessage(
                                                                                    'Failed to update start card',
                                                                                );
                                                                            },
                                                                        onFinish:
                                                                            () =>
                                                                                setSubmitting(
                                                                                    false,
                                                                                ),
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        card: false,
                                                                    }),
                                                                );
                                                                setPendingStart(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-lg font-medium">
                                                            €
                                                            {Number(
                                                                startTotals.card,
                                                            ).toFixed(2)}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setEditingStart(
                                                                    (e) => ({
                                                                        ...e,
                                                                        card: true,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-lg font-semibold">
                                                €
                                                {(
                                                    Number(startTotals.cash) +
                                                    Number(startTotals.card)
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t" />

                            {/* Last office shift (editable) */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Last office shift - safety check
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setLastCollapsed((s) => !s)
                                        }
                                    >
                                        {lastCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!lastCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €
                                                {Number(
                                                    lastTotals.cash,
                                                ).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €
                                                {Number(
                                                    lastTotals.card,
                                                ).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-lg font-semibold">
                                                €
                                                {(
                                                    Number(lastTotals.cash) +
                                                    Number(lastTotals.card)
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Active office shift
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setActiveCollapsed((s) => !s)
                                        }
                                    >
                                        {activeCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!activeCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Live Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{cashTotal.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Live Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{cardTotal.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-xl font-semibold">
                                                €{combinedTotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 border-t pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium">
                                        Total money (start + live)
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            setTotalCollapsed((s) => !s)
                                        }
                                    >
                                        {totalCollapsed ? 'Show' : 'Hide'}
                                    </Button>
                                </div>

                                {!totalCollapsed && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Cash
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{totalCash.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Card
                                            </div>
                                            <div className="text-lg font-medium">
                                                €{totalCard.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Combined
                                            </div>
                                            <div className="text-xl font-semibold">
                                                €{totalCombined.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Shift actions */}
                    <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <h3 className="text-sm font-semibold">
                            {formatShiftTitle(activeShift?.started_at)}
                        </h3>
                        <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
                            {activeShift && (
                                <div className="text-xs text-muted-foreground">
                                    Started by:{' '}
                                    {activeShift.started_by_email ?? 'Unknown'}
                                    {activeShift.started_at
                                        ? ` at ${formatStartTime(activeShift.started_at)}`
                                        : ''}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    disabled={Boolean(activeShift)}
                                    onClick={() => {
                                        router.post(
                                            '/office/start',
                                            {},
                                            {
                                                onStart: () =>
                                                    setSubmitting(true),
                                                onFinish: () =>
                                                    setSubmitting(false),
                                                onSuccess: () => {
                                                    setMessage('Shift started');
                                                    setTimeout(
                                                        () => router.reload(),
                                                        600,
                                                    );
                                                },
                                                onError: () =>
                                                    setMessage(
                                                        'Failed to start shift',
                                                    ),
                                            },
                                        );
                                    }}
                                >
                                    Start shift
                                </Button>

                                {activeShift?.status === 'open' ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                End shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                End this office shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Ending the shift will mark it as
                                                closed. This action can be
                                                reversed by reopening the shift,
                                                but historical context may
                                                change. Are you sure you want to
                                                end the shift?
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
                                                            if (!activeShift)
                                                                return;
                                                            router.post(
                                                                `/office/${activeShift?.id}/end`,
                                                                {},
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () => {
                                                                            setMessage(
                                                                                'Shift ended',
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    router.reload(),
                                                                                600,
                                                                            );
                                                                        },
                                                                    onError:
                                                                        () =>
                                                                            setMessage(
                                                                                'Failed to end shift',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        End shift
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                Reopen shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Reopen this office shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Reopening the shift will set its
                                                status back to open and clear
                                                the end time. Confirm if you
                                                want to continue.
                                            </DialogDescription>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>

                                                <DialogClose asChild>
                                                    <Button
                                                        onClick={() => {
                                                            if (!activeShift)
                                                                return;
                                                            router.post(
                                                                `/office/${activeShift?.id}/reopen`,
                                                                {},
                                                                {
                                                                    onStart:
                                                                        () =>
                                                                            setSubmitting(
                                                                                true,
                                                                            ),
                                                                    onFinish:
                                                                        () =>
                                                                            setSubmitting(
                                                                                false,
                                                                            ),
                                                                    onSuccess:
                                                                        () => {
                                                                            setMessage(
                                                                                'Shift reopened',
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    router.reload(),
                                                                                600,
                                                                            );
                                                                        },
                                                                    onError:
                                                                        () =>
                                                                            setMessage(
                                                                                'Failed to reopen shift',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Reopen shift
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>

                            {/* Quick add sale */}
                            <div className="mt-2 border-t pt-2">
                                <h4 className="text-xs font-medium">
                                    Quick add sale
                                </h4>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <select
                                        value={String(saleProductId ?? '')}
                                        onChange={(e) =>
                                            setSaleProductId(
                                                Number(e.target.value) || null,
                                            )
                                        }
                                        className="rounded-md border p-2"
                                    >
                                        {products.map((p: any) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — €
                                                {Number(p.price).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={saleMethod}
                                        onChange={(e) =>
                                            setSaleMethod(e.target.value as any)
                                        }
                                        className="rounded-md border p-2"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                    </select>
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        onClick={() => {
                                            if (!saleProductId || !activeShift)
                                                return;
                                            const product = products.find(
                                                (p: any) =>
                                                    p.id === saleProductId,
                                            );
                                            const amountToUse = product
                                                ? String(product.price)
                                                : '0';
                                            const tempId = `tmp-${Date.now()}`;
                                            const tempSale: any = {
                                                id: tempId,
                                                name: product?.name ?? '',
                                                method: saleMethod,
                                                amount: Number(amountToUse),
                                                description: '',
                                            };
                                            setSales((prev) => [
                                                tempSale,
                                                ...(prev || []),
                                            ]);
                                            setSubmitting(true);
                                            router.post(
                                                `/office/${activeShift?.id}/record-sale`,
                                                {
                                                    product_id: saleProductId,
                                                    method: saleMethod,
                                                    amount: amountToUse,
                                                },
                                                {
                                                    onSuccess: () =>
                                                        setMessage(
                                                            'Sale recorded',
                                                        ),
                                                    onError: () => {
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (s: any) =>
                                                                    s.id !==
                                                                    tempId,
                                                            ),
                                                        );
                                                        setMessage(
                                                            'Failed to record sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
                                                },
                                            );
                                        }}
                                    >
                                        Add sale
                                    </Button>

                                    <div className="flex-1" />
                                </div>
                            </div>

                            <div className="mt-2 border-t pt-2">
                                <h4 className="text-xs font-medium">
                                    Custom sale
                                </h4>

                                {/* Custom sale: only amount and description inputs are shown (product/method hidden but still sent) */}
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="€0.00"
                                            value={customAmount}
                                            onChange={(e) =>
                                                setCustomAmount(e.target.value)
                                            }
                                        />
                                    </div>

                                    <Input
                                        placeholder="Description"
                                        value={customDescription}
                                        onChange={(e) =>
                                            setCustomDescription(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        disabled={
                                            !activeShift ||
                                            !customAmount ||
                                            !customProductId
                                        }
                                        onClick={() => {
                                            if (
                                                !customProductId ||
                                                !activeShift ||
                                                !customAmount
                                            )
                                                return;
                                            const product = products.find(
                                                (p: any) =>
                                                    p.id === customProductId,
                                            );
                                            const amountToUse =
                                                String(customAmount);
                                            const descToUse = String(
                                                customDescription || '',
                                            );
                                            const tempId = `tmp-${Date.now()}`;
                                            const tempSale: any = {
                                                id: tempId,
                                                name: product?.name ?? '',
                                                method: 'Cash',
                                                amount: Number(amountToUse),
                                                description: descToUse,
                                            };
                                            setSales((prev) => [
                                                tempSale,
                                                ...(prev || []),
                                            ]);
                                            setSubmitting(true);
                                            router.post(
                                                `/office/${activeShift?.id}/record-sale`,
                                                {
                                                    product_id: customProductId,
                                                    method: 'Cash',
                                                    amount: amountToUse,
                                                    ...(descToUse
                                                        ? {
                                                              description:
                                                                  descToUse,
                                                          }
                                                        : {}),
                                                },
                                                {
                                                    onSuccess: () => {
                                                        setMessage(
                                                            'Custom sale recorded (Cash)',
                                                        );
                                                        setCustomAmount('');
                                                        setCustomDescription(
                                                            '',
                                                        );
                                                    },
                                                    onError: () => {
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (s: any) =>
                                                                    s.id !==
                                                                    tempId,
                                                            ),
                                                        );
                                                        setMessage(
                                                            'Failed to record custom sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
                                                },
                                            );
                                        }}
                                    >
                                        Add Cash
                                    </Button>

                                    <Button
                                        disabled={
                                            !activeShift ||
                                            !customAmount ||
                                            !customProductId
                                        }
                                        onClick={() => {
                                            if (
                                                !customProductId ||
                                                !activeShift ||
                                                !customAmount
                                            )
                                                return;
                                            const product = products.find(
                                                (p: any) =>
                                                    p.id === customProductId,
                                            );
                                            const amountToUse =
                                                String(customAmount);
                                            const descToUse = String(
                                                customDescription || '',
                                            );
                                            const tempId = `tmp-${Date.now()}`;
                                            const tempSale: any = {
                                                id: tempId,
                                                name: product?.name ?? '',
                                                method: 'Card',
                                                amount: Number(amountToUse),
                                                description: descToUse,
                                            };
                                            setSales((prev) => [
                                                tempSale,
                                                ...(prev || []),
                                            ]);
                                            setSubmitting(true);
                                            router.post(
                                                `/office/${activeShift?.id}/record-sale`,
                                                {
                                                    product_id: customProductId,
                                                    method: 'Card',
                                                    amount: amountToUse,
                                                    ...(descToUse
                                                        ? {
                                                              description:
                                                                  descToUse,
                                                          }
                                                        : {}),
                                                },
                                                {
                                                    onSuccess: () => {
                                                        setMessage(
                                                            'Custom sale recorded (Card)',
                                                        );
                                                        setCustomAmount('');
                                                        setCustomDescription(
                                                            '',
                                                        );
                                                    },
                                                    onError: () => {
                                                        setSales((prev) =>
                                                            (prev || []).filter(
                                                                (s: any) =>
                                                                    s.id !==
                                                                    tempId,
                                                            ),
                                                        );
                                                        setMessage(
                                                            'Failed to record custom sale',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setSubmitting(false),
                                                },
                                            );
                                        }}
                                    >
                                        Add Card
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Large container: sales log + details */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h3 className="mb-4 text-sm font-semibold">Sales log</h3>

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
                                {(sales || []).map((s: any) => (
                                    <tr key={String(s.id)} className="border-t">
                                        <td className="py-3">{s.id}</td>
                                        <td className="py-3">
                                            {s.name ?? s.item}
                                        </td>
                                        <td className="py-3">{s.method}</td>
                                        <td className="py-3">
                                            €{Number(s.amount ?? 0).toFixed(2)}
                                        </td>
                                        <td className="flex items-center justify-between py-3">
                                            <span>
                                                {s.description ?? s.buyer ?? ''}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={submitting}
                                                onClick={() => {
                                                    if (
                                                        !activeShift ||
                                                        submitting
                                                    )
                                                        return;
                                                    const saleId = s.id;
                                                    // optimistic remove
                                                    setSales((prev) =>
                                                        (prev || []).filter(
                                                            (x: any) =>
                                                                x.id !== saleId,
                                                        ),
                                                    );
                                                    setSubmitting(true);

                                                    router.post(
                                                        `/office/${activeShift?.id}/remove-sale`,
                                                        { sale_id: saleId },
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () =>
                                                                setMessage(
                                                                    'Sale removed',
                                                                ),
                                                            onError: () => {
                                                                // rollback
                                                                setSales(
                                                                    (prev) => [
                                                                        s,
                                                                        ...(prev ||
                                                                            []),
                                                                    ],
                                                                );
                                                                setMessage(
                                                                    'Failed to remove sale',
                                                                );
                                                            },
                                                            onFinish: () =>
                                                                setSubmitting(
                                                                    false,
                                                                ),
                                                        },
                                                    );
                                                }}
                                            >
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <div className="text-sm">
                            <div className="text-muted-foreground">Cash</div>
                            <div className="font-medium">
                                €{cashTotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="text-sm">
                            <div className="text-muted-foreground">Card</div>
                            <div className="font-medium">
                                €{cardTotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="text-sm">
                            <div className="text-muted-foreground">Total</div>
                            <div className="font-semibold">
                                €{combinedTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
