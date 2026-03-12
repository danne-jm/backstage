import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Pencil, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { BaseModal } from '@/components/office/base-modal';
import { CashBreakdownModal } from '@/components/office/cash-breakdown-modal';
import { SaleCashBreakdownModal } from '@/components/office/sale-cash-breakdown-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function SalesLogCard({ sales, activeShift }: any) {
    const [cashBreakdownOpen, setCashBreakdownOpen] = useState(false);
    const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
    const [editingSaleBreakdown, setEditingSaleBreakdown] = useState<
        Record<string, number>
    >({});
    const [editingSaleAmount, setEditingSaleAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Confirmation modal state
    const [confirmRemoveSaleId, setConfirmRemoveSaleId] = useState<
        string | null
    >(null);
    const [confirmRemoveSaleName, setConfirmRemoveSaleName] = useState('');

    const cashTotal = activeShift ? Number(activeShift.cash_total || 0) : 0;
    const cardTotal = activeShift ? Number(activeShift.card_total || 0) : 0;
    const combinedTotal = cashTotal + cardTotal;

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy HH:mm:ss');
        } catch {
            return '';
        }
    };

    const handleOpenSaleBreakdown = (sale: any) => {
        setEditingSaleId(sale.id);
        setEditingSaleBreakdown(sale.breakdown || {});
        setEditingSaleAmount(Number(sale.amount || 0));
    };

    const handleSaveSaleBreakdown = (breakdown: Record<string, number>) => {
        if (!activeShift?.id || !editingSaleId) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/update-sale-breakdown`,
            {
                sale_id: editingSaleId,
                breakdown: breakdown,
            },
            {
                onSuccess: () => {
                    setEditingSaleId(null);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleConfirmRemove = (sale: any) => {
        setConfirmRemoveSaleId(sale.id);
        setConfirmRemoveSaleName(sale.name || 'this sale');
    };

    const handleRemoveSale = () => {
        if (!activeShift?.id || !confirmRemoveSaleId) return;
        setSubmitting(true);
        router.delete(`/office/${activeShift.id}/remove-sale`, {
            data: { sale_id: confirmRemoveSaleId },
            onSuccess: () => {
                setConfirmRemoveSaleId(null);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="flex h-full w-full flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sales log</h3>
                <div className="text-xs text-muted-foreground">
                    {sales?.length} sales
                </div>
            </div>
            <div className="relative overflow-x-auto">
                <div className="max-h-[36rem] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-background text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="px-1 py-2 font-medium">Item</th>
                                <th className="px-1 py-2 font-medium">
                                    Method
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Amount
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Description
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Sold by
                                </th>
                                <th className="px-1 py-2 font-medium">
                                    Sold at
                                </th>
                                <th className="px-1 py-2 text-right font-medium">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="mt-2">
                            {sales?.map((s: any) => (
                                <tr key={s.id} className="border-t">
                                    <td className="overflow-hidden px-1 py-3">
                                        <div
                                            className="w-full truncate"
                                            title={s.name ?? ''}
                                        >
                                            {s.name ?? 'N/A'}
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-3">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <Badge
                                                variant="outline"
                                                className="capitalize"
                                                title={s.method}
                                            >
                                                {s.method}
                                            </Badge>
                                            {s.ticket_type === 'with_card' && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-white bg-white text-[10px] text-black hover:bg-white/90"
                                                >
                                                    ESNcard
                                                </Badge>
                                            )}
                                            {s.is_custom && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] capitalize"
                                                >
                                                    Custom
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className="truncate"
                                                title={`€${Number(s.amount ?? 0).toFixed(2)}`}
                                            >
                                                €
                                                {Number(s.amount ?? 0).toFixed(
                                                    2,
                                                )}
                                            </div>
                                            {String(s.method).toLowerCase() ===
                                                'cash' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={
                                                            activeShift?.status !==
                                                            'open'
                                                        }
                                                        onClick={() =>
                                                            handleOpenSaleBreakdown(
                                                                s,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-3">
                                        <div
                                            className="w-full truncate"
                                            title={s.description ?? ''}
                                        >
                                            {s.description ?? ''}
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-3">
                                        <div
                                            className="w-full truncate"
                                            title={s.sold_by ?? ''}
                                        >
                                            {s.sold_by ?? 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="overflow-hidden px-1 py-3">
                                        <div
                                            className="w-full truncate"
                                            title={formatDateTime(s.created_at)}
                                        >
                                            {formatDateTime(s.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-1 py-3 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled={
                                                activeShift?.status !== 'open'
                                            }
                                            onClick={() =>
                                                handleConfirmRemove(s)
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Per-sale editable breakdown modal */}
            <SaleCashBreakdownModal
                isOpen={editingSaleId !== null}
                onClose={() => setEditingSaleId(null)}
                title="Edit Sale Breakdown"
                description="Update the cash denomination counts for this sale."
                expectedAmount={editingSaleAmount}
                isSubmitting={submitting}
                onSave={handleSaveSaleBreakdown}
                initialBreakdown={editingSaleBreakdown}
            />

            {/* Confirmation modal for removing a sale */}
            <BaseModal
                isOpen={confirmRemoveSaleId !== null}
                onClose={() => setConfirmRemoveSaleId(null)}
                title="Remove Sale"
                description={`Are you sure you want to remove "${confirmRemoveSaleName}"? This action cannot be undone.`}
            >
                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setConfirmRemoveSaleId(null)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRemoveSale}
                        disabled={submitting}
                    >
                        Remove
                    </Button>
                </div>
            </BaseModal>

            <div className="mt-6 mt-auto flex justify-end gap-6 border-t pt-4">
                <div className="flex flex-col items-end text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <span>Cash</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="-mr-2 h-5 w-5 hover:bg-transparent"
                            onClick={() => setCashBreakdownOpen(true)}
                        >
                            <HelpCircle className="h-3 w-3" />
                        </Button>
                        <CashBreakdownModal
                            isOpen={cashBreakdownOpen}
                            onClose={() => setCashBreakdownOpen(false)}
                            title="Sales Log Cash Breakdown"
                            totalAmount={cashTotal}
                            breakdown={activeShift?.cash_breakdown}
                        />
                    </div>
                    <div className="py-1 text-base font-semibold">
                        €{cashTotal.toFixed(2)}
                    </div>
                </div>
                <div className="flex flex-col items-end text-sm">
                    <div className="text-muted-foreground">Card</div>
                    <div className="py-1 text-base font-semibold">
                        €{cardTotal.toFixed(2)}
                    </div>
                </div>
                <div className="flex flex-col items-end text-sm">
                    <div className="text-muted-foreground">Total</div>
                    <div className="py-1 text-base font-bold">
                        €{combinedTotal.toFixed(2)}
                    </div>
                </div>
            </div>
        </div>
    );
}
