import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { forwardRef, useState } from 'react';
import {
    computeBreakdownTotal,
    denominationConfig,
    formatTimestamp,
} from './utils';
import { OfficeCard } from './office-card';

interface LastShiftSummaryProps {
    lastShift: any;
    className?: string;
}

export const LastShiftSummary = forwardRef<HTMLDivElement, LastShiftSummaryProps>(
    ({ lastShift, className }, ref) => {
        const [isViewingStartBreakdown, setIsViewingStartBreakdown] = useState(false);
        const [isViewingEndBreakdown, setIsViewingEndBreakdown] = useState(false);

        return (
            <OfficeCard
                ref={ref}
                title="Last Office Shift"
                className={className}
                action={
                    lastShift ? (
                        <Link href={`/office/${lastShift.id}`}>
                            <Button size="sm" variant="ghost">
                                Review
                            </Button>
                        </Link>
                    ) : undefined
                }
            >
                {lastShift ? (
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Started</div>
                            <div className="text-sm font-medium">
                                {formatTimestamp(lastShift.started_at)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Ended</div>
                            <div className="text-sm font-medium">
                                {formatTimestamp(lastShift.ended_at)}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Workers</div>
                            <div className="text-sm">
                                {Array.isArray(lastShift.workers) &&
                                    lastShift.workers.length > 0
                                    ? lastShift.workers.map((w: any) => w.name).join(', ')
                                    : 'None'}
                            </div>
                        </div>
                        <div className="border-t pt-3">
                            <div className="text-xs text-muted-foreground">Start Money</div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <span>Cash:</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() => setIsViewingStartBreakdown(true)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                                <span className="font-medium">
                                    €{Number(lastShift.start_cash ?? 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Card:</span>
                                <span className="font-medium">
                                    €{Number(lastShift.start_card ?? 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="border-t pt-3">
                            <div className="text-xs text-muted-foreground">
                                End of Shift Money
                            </div>
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1">
                                    <span>Cash:</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() => setIsViewingEndBreakdown(true)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                                <span className="font-medium">
                                    €{Number(lastShift.total_cash ?? 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Card:</span>
                                <span className="font-medium">
                                    €{Number(lastShift.total_card ?? 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
                                <span>Total:</span>
                                <span>
                                    €
                                    {(
                                        Number(lastShift.total_cash ?? 0) +
                                        Number(lastShift.total_card ?? 0)
                                    ).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <Dialog
                            open={isViewingStartBreakdown}
                            onOpenChange={setIsViewingStartBreakdown}
                        >
                            <DialogContent>
                                <DialogTitle>Start of Shift Cash</DialogTitle>
                                <DialogDescription>
                                    Read-only cash distribution at the start of the shift.
                                </DialogDescription>
                                <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                    {denominationConfig.map((d) => (
                                        <div
                                            key={d.key}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                    {d.label}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {Number(
                                                    (lastShift?.start_cash_breakdown || {})[
                                                    d.key
                                                    ] ?? 0,
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between border-t pt-2">
                                        <div className="text-sm text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-lg font-medium">
                                            €
                                            {computeBreakdownTotal(
                                                lastShift?.start_cash_breakdown || {},
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog
                            open={isViewingEndBreakdown}
                            onOpenChange={setIsViewingEndBreakdown}
                        >
                            <DialogContent>
                                <DialogTitle>End of Shift Cash</DialogTitle>
                                <DialogDescription>
                                    Read-only cash distribution at the end of the shift.
                                </DialogDescription>
                                <div className="mt-4 grid grid-cols-1 gap-3 p-1">
                                    {denominationConfig.map((d) => (
                                        <div
                                            key={d.key}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="rounded-lg border bg-muted/40 px-3 py-1 text-sm">
                                                    {d.label}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {Number(
                                                    (
                                                        lastShift?.end_of_shift_cash_breakdown ||
                                                        {}
                                                    )[d.key] ?? 0,
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-between border-t pt-2">
                                        <div className="text-sm text-muted-foreground">
                                            Total
                                        </div>
                                        <div className="text-lg font-medium">
                                            €
                                            {computeBreakdownTotal(
                                                lastShift?.end_of_shift_cash_breakdown || {},
                                            ).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No office shifts available
                    </div>
                )}
            </OfficeCard>
        );
    },
);

LastShiftSummary.displayName = 'LastShiftSummary';
