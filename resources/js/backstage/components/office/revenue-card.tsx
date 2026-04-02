import { router } from '@inertiajs/react';
import { Eye, Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { CashBreakdownModal } from '@backstage/components/office/cash-breakdown-modal';
import { SaleCashBreakdownModal } from '@backstage/components/office/sale-cash-breakdown-modal';
import { Button } from '@backstage/components/ui/button';
import { Input } from '@backstage/components/ui/input';

export function RevenueCard({ activeShift }: any) {
    const [activeCollapsed, setActiveCollapsed] = useState(false);
    const [totalCollapsed, setTotalCollapsed] = useState(false);
    const [startCollapsed, setStartCollapsed] = useState(false);

    const [liveCashBreakdownOpen, setLiveCashBreakdownOpen] = useState(false);
    const [totalCashBreakdownOpen, setTotalCashBreakdownOpen] = useState(false);

    // Inline editing state for Start Cash/Card
    const [isStartCashModalOpen, setIsStartCashModalOpen] = useState(false);
    const [editingStartCard, setEditingStartCard] = useState(false);
    const [pendingStartCard, setPendingStartCard] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Compute totals based on activeShift
    const startCash = Number(activeShift?.start_cash) || 0;
    const startCard = Number(activeShift?.start_card) || 0;

    const cashTotal = activeShift ? Number(activeShift.cash_total || 0) : 0;
    const cardTotal = activeShift ? Number(activeShift.card_total || 0) : 0;
    const combinedTotal = cashTotal + cardTotal;

    const totalCash = startCash + cashTotal;
    const totalCard = startCard + cardTotal;
    const totalCombined = totalCash + totalCard;

    const handleSaveStartCard = () => {
        if (!activeShift?.id) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/update-start-totals`,
            {
                cash: Number(activeShift?.start_cash) || 0,
                card: Number(pendingStartCard) || 0,
            },
            {
                onSuccess: () => {
                    setEditingStartCard(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleSaveStartCashBreakdown = (
        breakdown: Record<string, number>,
    ) => {
        if (!activeShift?.id) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/update-cash-breakdown`,
            {
                target: 'start',
                breakdown: breakdown,
            },
            {
                onSuccess: () => {
                    setIsStartCashModalOpen(false);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const mergeBreakdowns = (b1: any, b2: any) => {
        const result: Record<string, number> = {};
        const keys = [
            '500e',
            '200e',
            '100e',
            '50e',
            '20e',
            '10e',
            '5e',
            '2e',
            '1e',
            '50c',
            '20c',
            '10c',
            '5c',
            '2c',
            '1c',
            'token',
        ];
        keys.forEach((k) => {
            result[k] = (Number(b1?.[k]) || 0) + (Number(b2?.[k]) || 0);
        });
        return result;
    };

    const totalBreakdown = mergeBreakdowns(
        activeShift?.start_cash_breakdown,
        activeShift?.cash_breakdown,
    );

    return (
        <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Revenue</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
                <div className="border-t pt-3">
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
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <span>Cash</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-lg font-medium">
                                        €{startCash.toFixed(2)}
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        disabled={
                                            activeShift?.status !== 'open'
                                        }
                                        onClick={() =>
                                            setIsStartCashModalOpen(true)
                                        }
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <SaleCashBreakdownModal
                                        isOpen={isStartCashModalOpen}
                                        onClose={setIsStartCashModalOpen}
                                        title="Start Cash Breakdown"
                                        description="Declare starting cash and tokens."
                                        initialBreakdown={
                                            activeShift?.start_cash_breakdown
                                        }
                                        onSave={handleSaveStartCashBreakdown}
                                        isSubmitting={submitting}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <span>Card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingStartCard ? (
                                        <>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                className="h-8 w-24"
                                                value={pendingStartCard}
                                                onChange={(e) =>
                                                    setPendingStartCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                onClick={handleSaveStartCard}
                                                disabled={submitting}
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setEditingStartCard(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-lg font-medium">
                                                €{startCard.toFixed(2)}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-5 w-5"
                                                disabled={
                                                    activeShift?.status !==
                                                    'open'
                                                }
                                                onClick={() => {
                                                    setPendingStartCard(
                                                        startCard.toString(),
                                                    );
                                                    setEditingStartCard(true);
                                                }}
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
                                    €{(startCash + startCard).toFixed(2)}
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
                                            setLiveCashBreakdownOpen(true)
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <CashBreakdownModal
                                        isOpen={liveCashBreakdownOpen}
                                        onClose={setLiveCashBreakdownOpen}
                                        title="Live Cash Breakdown"
                                        description="Cash received during the active shift."
                                        totalAmount={cashTotal}
                                        breakdown={activeShift?.cash_breakdown}
                                    />
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
                                            setTotalCashBreakdownOpen(true)
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <CashBreakdownModal
                                        isOpen={totalCashBreakdownOpen}
                                        onClose={setTotalCashBreakdownOpen}
                                        title="Total Cash Breakdown"
                                        description="Cash at start of shift + Live cash."
                                        totalAmount={totalCash}
                                        breakdown={totalBreakdown}
                                    />
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
