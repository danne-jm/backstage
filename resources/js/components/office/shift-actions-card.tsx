import { Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/office/base-modal';
import { SaleCashBreakdownModal } from '@/components/office/sale-cash-breakdown-modal';
import { VariantSelectionModal } from '@/components/office/variant-selection-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ShiftActionsCard({ activeShift, sellables }: any) {
    const [submitting, setSubmitting] = useState(false);
    const [saleProductId, setSaleProductId] = useState<string | null>(null);
    const [saleItemType, setSaleItemType] = useState<string | null>(null);
    const [saleTicketType, setSaleTicketType] = useState('with_card');

    const [customAmount, setCustomAmount] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [customSaleItemId, setCustomSaleItemId] = useState('custom');
    const [customSaleTicketType, setCustomSaleTicketType] =
        useState('without_card');

    // Modals
    const [isQuickSaleCashModalOpen, setIsQuickSaleCashModalOpen] =
        useState(false);
    const [isCustomSaleCashModalOpen, setIsCustomSaleCashModalOpen] =
        useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [pendingSaleMethod, setPendingSaleMethod] = useState<
        'cash' | 'card' | null
    >(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        null,
    );

    // Confirmation Modals
    const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);
    const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
    const [isReopenConfirmOpen, setIsReopenConfirmOpen] = useState(false);
    const [reopenError, setReopenError] = useState<string | null>(null);

    useEffect(() => {
        if (sellables && sellables.length > 0 && !saleProductId) {
            const timer = setTimeout(() => {
                const first = sellables[0];
                setSaleProductId(first.unique_id);
                setSaleItemType(first.type);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sellables, saleProductId]);

    const formatShiftHeader = (shift: any) => {
        if (!shift?.started_at) return 'No Active Shift';
        try {
            const startDate = new Date(shift.started_at);
            const datePart = format(startDate, 'eeee, MMMM do yyyy');
            const startTime = format(startDate, 'HH:mm');

            if (shift.status === 'closed' && shift.ended_at) {
                const endTime = format(new Date(shift.ended_at), 'HH:mm');
                return `${datePart}, ${startTime} - ${endTime}`;
            }

            return `${datePart}, started at ${startTime}`;
        } catch {
            return 'Office Shift';
        }
    };

    const handleStartShift = () => {
        setSubmitting(true);
        router.post(
            '/office/start',
            {},
            {
                onSuccess: () => setIsStartConfirmOpen(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleEndShift = () => {
        if (!activeShift?.id) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/end`,
            {},
            {
                onSuccess: () => setIsEndConfirmOpen(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleReopenShift = () => {
        if (!activeShift?.id) return;
        setSubmitting(true);
        setReopenError(null);
        router.post(
            `/office/${activeShift.id}/reopen`,
            {},
            {
                onSuccess: () => {
                    setIsReopenConfirmOpen(false);
                },
                onError: (errors: any) => {
                    if (errors.shift) {
                        setReopenError(errors.shift);
                    } else {
                        setReopenError('An error occurred while reopening.');
                    }
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const getQuickSalePrice = () => {
        const item = sellables?.find(
            (i: any) => String(i.unique_id) === String(saleProductId),
        );
        if (!item) return 0;

        if (item.type === 'event') {
            return saleTicketType === 'with_card'
                ? Number(item.price_with_card || item.price || 0)
                : Number(item.price_without_card || 0);
        }

        return Number(item.price || item.price_without_card || 0);
    };

    const getQuantityLabel = (item: any) => {
        if (item.is_variant_based) return 'Variants';

        if (item.type === 'event') {
            // Variable-amount events have separate with_card / without_card pools
            if (item.variable_amount) {
                const withCard    = item.unlimited_quantity_with_card    ? null : (item.remaining_with_card    ?? null);
                const withoutCard = item.unlimited_quantity_without_card ? null : (item.remaining_without_card ?? null);
                if (withCard === null && withoutCard === null) return 'Unlimited';
                const parts: string[] = [];
                if (withCard    !== null) parts.push(`${withCard} w/card`);
                if (withoutCard !== null) parts.push(`${withoutCard} w/o card`);
                return parts.join(', ') || 'Unlimited';
            }
            // Simple event: single pool
            if (item.unlimited_quantity) return 'Unlimited';
            const rem = item.remaining ?? null;
            if (rem === null) return 'Unlimited';
            if (rem <= 0) return 'Sold out';
            return `${rem} left`;
        }

        // Product
        if (item.unlimited_quantity) return 'Unlimited';
        const rem = item.remaining ?? null;
        if (rem === null) return 'Unlimited';
        if (rem <= 0) return 'Sold out';
        return `${rem} left`;
    };

    const isSellableActive = (item: any) => {
        const now = new Date();
        const start = item.start_sell_date
            ? new Date(item.start_sell_date)
            : null;
        const end = item.end_sell_date ? new Date(item.end_sell_date) : null;

        if (start && now < start) return false;
        if (end && now > end) return false;
        return true;
    };

    /**
     * Returns true when the currently selected Quick-add item is sold out
     * for the chosen ticket type (or has no remaining stock at all).
     */
    const isQuickSaleItemSoldOut = (): boolean => {
        if (!saleProductId) return false;
        const item = sellables?.find(
            (i: any) => String(i.unique_id) === String(saleProductId),
        );
        if (!item) return false;
        // Variant-based: the modal handles per-variant stock; don't block here
        if (item.is_variant_based) return false;

        if (item.type === 'event') {
            if (item.variable_amount) {
                if (saleTicketType === 'with_card') {
                    return !item.unlimited_quantity_with_card &&
                        item.remaining_with_card !== null &&
                        item.remaining_with_card <= 0;
                }
                return !item.unlimited_quantity_without_card &&
                    item.remaining_without_card !== null &&
                    item.remaining_without_card <= 0;
            }
            // Simple event
            return !item.unlimited_quantity &&
                item.remaining !== null &&
                item.remaining <= 0;
        }

        // Product
        return !item.unlimited_quantity &&
            item.remaining !== null &&
            item.remaining <= 0;
    };

    const activeSellables = sellables?.filter(isSellableActive) || [];

    const getDropdownPriceLabel = (item: any) => {
        if (item.is_variant_based) return '';
        if (item.type === 'event' && item.price_without_card) {
            return ` — €${Number(item.price_with_card || item.price || 0).toFixed(2)} / €${Number(item.price_without_card || 0).toFixed(2)}`;
        }
        return ` — €${Number(item.price || item.price_without_card || 0).toFixed(2)}`;
    };

    const handleQuickSaleCard = (variantId?: string | null) => {
        if (!activeShift?.id || !saleProductId) return;
        const item = sellables?.find(
            (i: any) => String(i.unique_id) === String(saleProductId),
        );
        if (!item) return;

        // If item is variant based but no variantId provided, open modal
        if (item.is_variant_based && !variantId) {
            setPendingSaleMethod('card');
            setIsVariantModalOpen(true);
            return;
        }

        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/record-sale`,
            {
                product_id: item.actual_id,
                item_type: saleItemType,
                method: 'card',
                amount: getQuickSalePrice(),
                description: 'Quick Sale',
                ticket_type: item.type === 'event' ? saleTicketType : null,
                variant_id: variantId || selectedVariantId,
            },
            {
                onSuccess: () => {
                    setIsVariantModalOpen(false);
                    setSelectedVariantId(null);
                    setPendingSaleMethod(null);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const triggerQuickSaleCash = () => {
        if (!activeShift?.id || !saleProductId) return;
        const item = sellables?.find(
            (i: any) => String(i.unique_id) === String(saleProductId),
        );
        if (!item) return;

        if (item.is_variant_based && !selectedVariantId) {
            setPendingSaleMethod('cash');
            setIsVariantModalOpen(true);
            return;
        }

        setIsQuickSaleCashModalOpen(true);
    };

    const handleQuickSaleCash = (breakdown: Record<string, number>) => {
        if (!activeShift?.id || !saleProductId) return;
        const item = sellables?.find(
            (i: any) => String(i.unique_id) === String(saleProductId),
        );
        if (!item) return;
        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/record-sale`,
            {
                product_id: item.actual_id,
                item_type: saleItemType,
                method: 'cash',
                amount: getQuickSalePrice(),
                description: 'Quick Sale',
                breakdown: breakdown,
                ticket_type: item.type === 'event' ? saleTicketType : null,
                variant_id: selectedVariantId,
            },
            {
                onSuccess: () => {
                    setIsQuickSaleCashModalOpen(false);
                    setIsVariantModalOpen(false);
                    setSelectedVariantId(null);
                    setPendingSaleMethod(null);
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleVariantSelection = (variantId: string) => {
        setSelectedVariantId(variantId);
        setIsVariantModalOpen(false);

        if (pendingSaleMethod === 'card') {
            handleQuickSaleCard(variantId);
        } else if (pendingSaleMethod === 'cash') {
            setIsQuickSaleCashModalOpen(true);
        }
    };

    const getCustomSalePrice = () => Number(customAmount || 0);

    const handleCustomSaleCard = () => {
        if (!activeShift?.id || !customDescription || !customAmount) return;

        const isCustom = customSaleItemId === 'custom';
        const item = isCustom
            ? null
            : sellables?.find(
                  (i: any) => String(i.unique_id) === String(customSaleItemId),
              );

        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/record-sale`,
            {
                product_id: item ? item.actual_id : null,
                item_type: item ? item.type : 'custom',
                method: 'card',
                amount: getCustomSalePrice(),
                description:
                    customDescription || (item ? item.name : 'Custom Sale'),
                ticket_type: customSaleTicketType,
            },
            {
                onSuccess: () => {
                    setCustomAmount('');
                    setCustomDescription('');
                    setCustomSaleItemId('custom');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const handleCustomSaleCash = (breakdown: Record<string, number>) => {
        if (!activeShift?.id || !customDescription || !customAmount) return;

        const isCustom = customSaleItemId === 'custom';
        const item = isCustom
            ? null
            : sellables?.find(
                  (i: any) => String(i.unique_id) === String(customSaleItemId),
              );

        setSubmitting(true);
        router.post(
            `/office/${activeShift.id}/record-sale`,
            {
                product_id: item ? item.actual_id : null,
                item_type: item ? item.type : 'custom',
                method: 'cash',
                amount: getCustomSalePrice(),
                description:
                    customDescription || (item ? item.name : 'Custom Sale'),
                breakdown: breakdown,
                ticket_type: customSaleTicketType,
            },
            {
                onSuccess: () => {
                    setIsCustomSaleCashModalOpen(false);
                    setCustomAmount('');
                    setCustomDescription('');
                    setCustomSaleItemId('custom');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    return (
        <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <h3 className="text-sm font-semibold">
                {formatShiftHeader(activeShift)}
            </h3>
            <div className="mt-4 flex flex-col gap-3">
                <div className="flex gap-2">
                    {activeShift?.status === 'closed' ? (
                        <Button
                            variant="secondary"
                            className="flex-1"
                            disabled={submitting}
                            onClick={() => setIsReopenConfirmOpen(true)}
                        >
                            Reopen shift
                        </Button>
                    ) : (
                        <Button
                            variant="secondary"
                            className="flex-1"
                            disabled={
                                activeShift?.status === 'open' || submitting
                            }
                            onClick={() => setIsStartConfirmOpen(true)}
                        >
                            Start shift
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="flex-1"
                        disabled={activeShift?.status !== 'open' || submitting}
                        onClick={() => setIsEndConfirmOpen(true)}
                    >
                        End shift
                    </Button>
                </div>

                {/* Confirmation Modals */}
                <BaseModal
                    isOpen={isStartConfirmOpen}
                    onClose={() => setIsStartConfirmOpen(false)}
                    title="Start Office Shift"
                    description="Are you sure you want to start a new office shift?"
                >
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsStartConfirmOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStartShift}
                            disabled={submitting}
                        >
                            Start Shift
                        </Button>
                    </div>
                </BaseModal>

                <BaseModal
                    isOpen={isEndConfirmOpen}
                    onClose={() => setIsEndConfirmOpen(false)}
                    title="End Office Shift"
                    description="Are you sure you want to end this office shift? This will finalize the totals and close the shift."
                >
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEndConfirmOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleEndShift}
                            disabled={submitting}
                        >
                            End Shift
                        </Button>
                    </div>
                </BaseModal>

                <BaseModal
                    isOpen={isReopenConfirmOpen}
                    onClose={() => {
                        setIsReopenConfirmOpen(false);
                        setReopenError(null);
                    }}
                    title="Reopen Office Shift"
                    description="Are you sure you want to reopen this closed office shift?"
                >
                    {reopenError && (
                        <div className="mt-2 text-sm font-medium text-destructive">
                            {reopenError}
                        </div>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReopenConfirmOpen(false);
                                setReopenError(null);
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReopenShift}
                            disabled={submitting}
                        >
                            Reopen Shift
                        </Button>
                    </div>
                </BaseModal>

                <div className="mt-2 border-t pt-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium">Quick add sale</h4>
                        <Link href="/sellables">
                            <Button size="sm" variant="ghost">
                                Manage
                            </Button>
                        </Link>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                        <select
                            value={String(saleProductId ?? '')}
                            onChange={(e) => {
                                const id = e.target.value || null;
                                setSaleProductId(id);
                                const item = sellables.find(
                                    (i: any) =>
                                        String(i.unique_id) === String(id),
                                );
                                if (item) setSaleItemType(item.type);
                            }}
                            className="w-full rounded-md border border-input bg-background bg-transparent p-2 text-sm"
                            disabled={activeShift?.status !== 'open'}
                        >
                            <option value="">Select item...</option>
                            {activeSellables.map((item: any) => (
                                <option
                                    key={item.unique_id}
                                    value={item.unique_id}
                                >
                                    {item.name} ({getQuantityLabel(item)})
                                    {getDropdownPriceLabel(item)}
                                </option>
                            ))}
                        </select>
                    </div>
                    {saleItemType === 'event' && saleProductId && (
                        <div className="mt-2 space-y-2">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="ticket-type"
                                    value="with_card"
                                    checked={saleTicketType === 'with_card'}
                                    onChange={() =>
                                        setSaleTicketType('with_card')
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">With ESNcard</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="ticket-type"
                                    value="without_card"
                                    checked={saleTicketType === 'without_card'}
                                    onChange={() =>
                                        setSaleTicketType('without_card')
                                    }
                                    className="h-4 w-4"
                                />
                                <span className="text-sm">Without ESNcard</span>
                            </label>
                        </div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                        <Button
                            disabled={
                                activeShift?.status !== 'open' ||
                                submitting ||
                                !saleProductId ||
                                isQuickSaleItemSoldOut()
                            }
                            onClick={triggerQuickSaleCash}
                        >
                            Add Cash
                        </Button>
                        <Button
                            variant="outline"
                            disabled={
                                activeShift?.status !== 'open' ||
                                submitting ||
                                !saleProductId ||
                                isQuickSaleItemSoldOut()
                            }
                            onClick={() => handleQuickSaleCard()}
                        >
                            Add Card
                        </Button>
                        <VariantSelectionModal
                            isOpen={isVariantModalOpen}
                            onClose={() => {
                                setIsVariantModalOpen(false);
                                setPendingSaleMethod(null);
                            }}
                            onConfirm={handleVariantSelection}
                            sellable={sellables?.find(
                                (i: any) =>
                                    String(i.unique_id) ===
                                    String(saleProductId),
                            )}
                        />
                        <SaleCashBreakdownModal
                            isOpen={isQuickSaleCashModalOpen}
                            onClose={setIsQuickSaleCashModalOpen}
                            title="Quick Sale Breakdown"
                            description="Confirm the cash received."
                            expectedAmount={getQuickSalePrice()}
                            isSubmitting={submitting}
                            onSave={handleQuickSaleCash}
                            initialBreakdown={{}}
                        />
                    </div>
                </div>

                <div className="mt-2 border-t pt-2">
                    <h4 className="text-xs font-medium">Custom sale</h4>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                        <select
                            value={customSaleItemId}
                            onChange={(e) =>
                                setCustomSaleItemId(e.target.value)
                            }
                            className="w-full rounded-md border border-input bg-background bg-transparent p-2 text-sm"
                            disabled={activeShift?.status !== 'open'}
                        >
                            <option value="custom">Custom</option>
                            {activeSellables.map((item: any) => (
                                <option
                                    key={item.unique_id}
                                    value={item.unique_id}
                                >
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="€0.00"
                                value={customAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                        value === '' ||
                                        /^\d*\.?\d*$/.test(value)
                                    )
                                        setCustomAmount(value);
                                }}
                                disabled={activeShift?.status !== 'open'}
                            />
                        </div>
                        <Input
                            placeholder="Description (mandatory)"
                            value={customDescription}
                            onChange={(e) =>
                                setCustomDescription(e.target.value)
                            }
                            disabled={activeShift?.status !== 'open'}
                        />
                    </div>
                    <div className="mt-2 space-y-2">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="radio"
                                name="custom-ticket-type"
                                value="with_card"
                                checked={customSaleTicketType === 'with_card'}
                                onChange={() =>
                                    setCustomSaleTicketType('with_card')
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm">With ESNcard</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input
                                type="radio"
                                name="custom-ticket-type"
                                value="without_card"
                                checked={
                                    customSaleTicketType === 'without_card'
                                }
                                onChange={() =>
                                    setCustomSaleTicketType('without_card')
                                }
                                className="h-4 w-4"
                            />
                            <span className="text-sm">Without ESNcard</span>
                        </label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Button
                            disabled={
                                !activeShift ||
                                !customAmount ||
                                !customDescription ||
                                activeShift?.status !== 'open' ||
                                submitting
                            }
                            onClick={() => setIsCustomSaleCashModalOpen(true)}
                        >
                            Add Cash
                        </Button>
                        <Button
                            variant="outline"
                            disabled={
                                !activeShift ||
                                !customAmount ||
                                !customDescription ||
                                activeShift?.status !== 'open' ||
                                submitting
                            }
                            onClick={handleCustomSaleCard}
                        >
                            Add Card
                        </Button>
                        <SaleCashBreakdownModal
                            isOpen={isCustomSaleCashModalOpen}
                            onClose={setIsCustomSaleCashModalOpen}
                            title="Custom Sale Breakdown"
                            description="Confirm the cash received."
                            expectedAmount={getCustomSalePrice()}
                            isSubmitting={submitting}
                            onSave={handleCustomSaleCash}
                            initialBreakdown={{}}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
