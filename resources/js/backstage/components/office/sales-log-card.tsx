import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Pencil, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';
import { BaseModal } from '@backstage/components/office/base-modal';
import { CashBreakdownModal } from '@backstage/components/office/cash-breakdown-modal';
import { SaleCashBreakdownModal } from '@backstage/components/office/sale-cash-breakdown-modal';
import { Badge } from '@backstage/components/ui/badge';
import { Button } from '@backstage/components/ui/button';
import { Alert, AlertTitle } from '@backstage/components/ui/alert';
import { VariantSelectionModal } from '@backstage/components/office/variant-selection-modal';
import { summarizeSales } from '@backstage/components/office/utils';

export function SalesLogCard({ sales, onlineSales = [], activeShift, sellables }: any) {
    // Merge and sort in-person and online sales by time descending
    const allSales = [
        ...sales,
        ...onlineSales,
    ].sort((a: any, b: any) => {
        const aTime = new Date(a.created_at ?? a.sold_at ?? 0).getTime();
        const bTime = new Date(b.created_at ?? b.sold_at ?? 0).getTime();
        return bTime - aTime;
    });

    const [cashBreakdownOpen, setCashBreakdownOpen] = useState(false);
    const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
    const [editingSaleBreakdown, setEditingSaleBreakdown] = useState<
        Record<string, number>
    >({});
    const [editingSaleAmount, setEditingSaleAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Variant editing state
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [isVariantModalReadOnly, setIsVariantModalReadOnly] = useState(false);
    const [editingVariantSale, setEditingVariantSale] = useState<any>(null);

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Confirmation modal state
    const [confirmRemoveSaleId, setConfirmRemoveSaleId] = useState<
        string | null
    >(null);
    const [confirmRemoveSaleName, setConfirmRemoveSaleName] = useState('');

    const totalSalesAmount = allSales.reduce(
        (sum: number, s: any) => sum + Number(s.amount ?? 0),
        0,
    );
    const salesSummaryText = summarizeSales(allSales);

    const cashTotal = allSales
        .filter((s: any) => !s.is_online && String(s.method).toLowerCase() === 'cash')
        .reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0);
    const cardTotal = allSales
        .filter((s: any) => s.is_online || String(s.method).toLowerCase() === 'card')
        .reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0);
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
        // Fallback to sale.amount if expected_amount is not available
        setEditingSaleAmount(Number(sale.expected_amount ?? sale.amount ?? 0));
    };

    const getSellableForSale = (sale: any) => {
        if (!sellables || !sale) return null;
        return sellables.find(
            (i: any) =>
                String(i.actual_id) === String(sale.actual_id) &&
                String(i.type) === String(sale.item_type)
        );
    };

    const handleSaveSaleVariant = (variantId: string) => {
        if (!activeShift?.id || !editingVariantSale?.id) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/update-sale-variant`,
            {
                sale_id: editingVariantSale.id,
                variant_id: variantId,
            },
            {
                onSuccess: () => {
                    setIsVariantModalOpen(false);
                    setEditingVariantSale(null);
                    showToast('Variant updated successfully');
                },
                onError: (errors: any) => {
                    showToast(errors.stock || errors.sale_id || 'Failed to update variant');
                },
                onFinish: () => setSubmitting(false),
            }
        );
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
        <>
            {toastMessage && (
                <div className="fixed top-4 left-1/2 z-50 w-[min(90%,30rem)] -translate-x-1/2 transform">
                    <Alert className="bg-background border-primary">
                        <AlertTitle>{toastMessage}</AlertTitle>
                    </Alert>
                </div>
            )}

            <div className="flex h-full w-full flex-col">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="shrink-0 text-sm font-semibold">
                        Sales log
                    </h3>
                    <div
                        className="truncate text-right text-xs text-muted-foreground"
                        title={`${allSales.length} sales | €${totalSalesAmount.toFixed(
                            2,
                        )}${salesSummaryText
                            ? ` | ${salesSummaryText}`
                            : ''
                            }`}
                    >
                        {`${allSales.length} sales${salesSummaryText ? ` | ${salesSummaryText}` : ''
                            }`}
                    </div>
                </div>
                <div className="relative overflow-x-auto">
                    <div className="max-h-[36rem] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-background text-xs text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-1 py-2 font-medium">Item</th>
                                    <th className="px-1 py-2 font-medium">Method</th>
                                    <th className="px-1 py-2 font-medium">Amount</th>
                                    <th className="px-1 py-2 font-medium">Description</th>
                                    <th className="px-1 py-2 font-medium">Sold by</th>
                                    <th className="px-1 py-2 font-medium">Sold at</th>
                                    <th className="px-1 py-2 text-right font-medium">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="mt-2">
                                {allSales.map((s: any) => (
                                    <tr key={s.id} className="border-t">
                                        <td className="overflow-hidden px-1 py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="truncate" title={s.name ?? ''}>
                                                        {s.name ?? 'N/A'}
                                                    </div>
                                                    {s.is_variant_based && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 shrink-0"
                                                            disabled={!s.is_online && activeShift?.status !== 'open'}
                                                            onClick={() => {
                                                                setEditingVariantSale(s);
                                                                setIsVariantModalReadOnly(!!s.is_online);
                                                                setIsVariantModalOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {s.variant_options && (
                                                    <div className="text-[10px] text-muted-foreground truncate" title={Object.values(s.variant_options).join(', ')}>
                                                        {Object.values(s.variant_options).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="overflow-hidden px-1 py-3">
                                            {s.is_online ? (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Badge className="border-transparent bg-blue-800 text-white hover:bg-blue-800">
                                                        Online
                                                    </Badge>
                                                    {(s.ticket_type === 'with_card' || !!s.code_used) && (
                                                        <Badge variant="outline" className="border-white bg-white text-[10px] text-black hover:bg-white/90">
                                                            ESNcard
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap items-center gap-1">
                                                    <Badge variant="outline" className="capitalize" title={s.method}>
                                                        {s.method}
                                                    </Badge>
                                                    {s.ticket_type === 'with_card' && (
                                                        <Badge variant="outline" className="border-white bg-white text-[10px] text-black hover:bg-white/90">
                                                            ESNcard
                                                        </Badge>
                                                    )}
                                                    {s.is_custom && (
                                                        <Badge variant="secondary" className="text-[10px] capitalize">
                                                            Custom
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="overflow-hidden px-1 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {(() => {
                                                    const amt = Number(s.amount ?? 0);
                                                    const exp = Number(s.expected_amount ?? s.amount ?? 0);
                                                    const diff = amt - exp;
                                                    const colorClass = !s.is_online && diff > 0.01 ? 'text-green-500 font-medium' : !s.is_online && diff < -0.01 ? 'text-red-500 font-medium' : '';
                                                    return (
                                                        <div className={`truncate ${colorClass}`} title={`€${amt.toFixed(2)}`}>
                                                            €{amt.toFixed(2)}
                                                        </div>
                                                    );
                                                })()}
                                                {!s.is_online && String(s.method).toLowerCase() === 'cash' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={activeShift?.status !== 'open'}
                                                        onClick={() => handleOpenSaleBreakdown(s)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="overflow-hidden px-1 py-3">
                                            <div className="w-full truncate text-xs text-muted-foreground" title={s.is_online ? (s.reference_id ?? '') : (s.description ?? '')}>
                                                {s.is_online
                                                    ? (s.reference_id ? `Ref: ${s.reference_id}` : '')
                                                    : (s.description ?? '')}
                                            </div>
                                        </td>
                                        <td className="overflow-hidden px-1 py-3">
                                            <div className="w-full truncate" title={s.is_online ? 'Online Store' : (s.sold_by ?? '')}>
                                                {s.is_online ? 'Online Store' : (s.sold_by ?? 'Unknown')}
                                            </div>
                                        </td>
                                        <td className="overflow-hidden px-1 py-3">
                                            <div className="w-full truncate" title={formatDateTime(s.created_at)}>
                                                {formatDateTime(s.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-1 py-3 text-right">
                                            {!s.is_online && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={activeShift?.status !== 'open'}
                                                    onClick={() => handleConfirmRemove(s)}
                                                >
                                                    Remove
                                                </Button>
                                            )}
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

                <VariantSelectionModal
                    isOpen={isVariantModalOpen}
                    onClose={() => {
                        setIsVariantModalOpen(false);
                        setEditingVariantSale(null);
                        setIsVariantModalReadOnly(false);
                    }}
                    onConfirm={handleSaveSaleVariant}
                    sellable={
                        editingVariantSale
                            ? getSellableForSale(editingVariantSale) || {
                                name: editingVariantSale.name,
                                variants_config: Object.keys(
                                    editingVariantSale.variant_options ?? {},
                                ).map((k) => ({
                                    name: k,
                                    options: [
                                        editingVariantSale.variant_options[
                                        k
                                        ],
                                    ],
                                })),
                                variants: [],
                            }
                            : null
                    }
                    initialOptions={editingVariantSale?.variant_options}
                    readOnly={isVariantModalReadOnly}
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
        </>
    );
}
