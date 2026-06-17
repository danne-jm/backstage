import { Button } from '@/Components/Shared/ui/button';
import { Input } from '@/Components/Shared/ui/input';
import { OfficeShift } from '@/types';
import { router } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import * as React from 'react';

interface RevenueSummaryProps {
    activeShift: OfficeShift | null | undefined;
    revenueRef: React.RefObject<HTMLDivElement>;
    startTotals: { cash: number; card: number };
    setStartTotals: React.Dispatch<
        React.SetStateAction<{ cash: number; card: number }>
    >;
    cashTotal: number;
    cardTotal: number;
    combinedTotal: number;
    editingStart: { cash: boolean; card: boolean };
    setEditingStart: React.Dispatch<
        React.SetStateAction<{ cash: boolean; card: boolean }>
    >;
    pendingStart: { cash: number; card: number } | null;
    setPendingStart: React.Dispatch<
        React.SetStateAction<{ cash: number; card: number } | null>
    >;
    setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
    setMessage: React.Dispatch<React.SetStateAction<string>>;
    mutate: any;
    openCashModalForStart: () => void;
    setIsViewingLiveCashBreakdown: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    setIsViewingTotalCashBreakdown: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    totalCash: number;
    totalCard: number;
    totalCombined: number;
}

export function RevenueSummary({
    activeShift,
    revenueRef,
    startTotals,
    setStartTotals,
    cashTotal,
    cardTotal,
    combinedTotal,
    editingStart,
    setEditingStart,
    pendingStart,
    setPendingStart,
    setSubmitting,
    setMessage,
    mutate,
    openCashModalForStart,
    setIsViewingLiveCashBreakdown,
    setIsViewingTotalCashBreakdown,
    totalCash,
    totalCard,
    totalCombined,
}: RevenueSummaryProps) {
    const [startCollapsed, setStartCollapsed] = React.useState<boolean>(false);
    const [activeCollapsed, setActiveCollapsed] =
        React.useState<boolean>(false);
    const [totalCollapsed, setTotalCollapsed] = React.useState<boolean>(false);

    return (
        <section
            ref={revenueRef}
            className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border"
        >
            <h3 className="text-sm font-semibold">Revenue</h3>
            <div className="mt-4 space-y-3">
                <div>
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">
                            Start of shift
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStartCollapsed((s) => !s)}
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
                                                    setPendingStart((prev) => ({
                                                        ...(prev ??
                                                            startTotals),
                                                        cash: Number(
                                                            e.target.value || 0,
                                                        ),
                                                    }))
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (!activeShift) return;
                                                    const originalTotals = {
                                                        ...startTotals,
                                                    };
                                                    const newCash =
                                                        pendingStart?.cash ??
                                                        startTotals.cash;
                                                    setSubmitting(true);
                                                    setStartTotals((s) => ({
                                                        ...s,
                                                        cash: newCash,
                                                    }));
                                                    setEditingStart((e) => ({
                                                        ...e,
                                                        cash: false,
                                                    }));
                                                    setPendingStart(null);
                                                    router.post(
                                                        `/office/${activeShift.id}/update-start-totals`,
                                                        {
                                                            cash: newCash,
                                                            card: startTotals.card,
                                                        },
                                                        {
                                                            onSuccess: () => {
                                                                setMessage(
                                                                    'Start cash updated',
                                                                );
                                                                mutate();
                                                            },
                                                            onError: () => {
                                                                setMessage(
                                                                    'Failed to update start cash',
                                                                );
                                                                setStartTotals(
                                                                    originalTotals,
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
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingStart((e) => ({
                                                        ...e,
                                                        cash: false,
                                                    }));
                                                    setPendingStart(null);
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
                                                disabled={
                                                    activeShift?.status ===
                                                    'closed'
                                                }
                                                onClick={() =>
                                                    openCashModalForStart()
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
                                                    setPendingStart((prev) => ({
                                                        ...(prev ??
                                                            startTotals),
                                                        card: Number(
                                                            e.target.value || 0,
                                                        ),
                                                    }))
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (!activeShift) return;
                                                    const originalTotals = {
                                                        ...startTotals,
                                                    };
                                                    const newCard =
                                                        pendingStart?.card ??
                                                        startTotals.card;
                                                    setSubmitting(true);
                                                    setStartTotals((s) => ({
                                                        ...s,
                                                        card: newCard,
                                                    }));
                                                    setEditingStart((e) => ({
                                                        ...e,
                                                        card: false,
                                                    }));
                                                    setPendingStart(null);
                                                    router.post(
                                                        `/office/${activeShift.id}/update-start-totals`,
                                                        {
                                                            cash: startTotals.cash,
                                                            card: newCard,
                                                        },
                                                        {
                                                            onSuccess: () => {
                                                                setMessage(
                                                                    'Start card updated',
                                                                );
                                                                mutate();
                                                            },
                                                            onError: () => {
                                                                setMessage(
                                                                    'Failed to update start card',
                                                                );
                                                                setStartTotals(
                                                                    originalTotals,
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
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setEditingStart((e) => ({
                                                        ...e,
                                                        card: false,
                                                    }));
                                                    setPendingStart(null);
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
                                                disabled={
                                                    activeShift?.status ===
                                                    'closed'
                                                }
                                                onClick={() =>
                                                    setEditingStart((e) => ({
                                                        ...e,
                                                        card: true,
                                                    }))
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
                <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">
                            Active office shift
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActiveCollapsed((s) => !s)}
                        >
                            {activeCollapsed ? 'Show' : 'Hide'}
                        </Button>
                    </div>
                    {!activeCollapsed && (
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <span>Live Cash</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() =>
                                            setIsViewingLiveCashBreakdown(true)
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
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
                            onClick={() => setTotalCollapsed((s) => !s)}
                        >
                            {totalCollapsed ? 'Show' : 'Hide'}
                        </Button>
                    </div>
                    {!totalCollapsed && (
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <span>Cash</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() =>
                                            setIsViewingTotalCashBreakdown(true)
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
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
    );
}
