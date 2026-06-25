import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { index as officeRoute } from '@/routes/backstage/office';
import { end as shiftEndRoute, reopen as shiftReopenRoute } from '@/routes/backstage/office/shift';
import { record as recordSaleRoute, voidMethod as voidSaleRoute } from '@/routes/backstage/office/sale';
import { useState } from 'react';
import { UserIcon } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

function formatDate(dateStr: string, formatStyle: 'short' | 'long' | 'medium' = 'long') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (formatStyle === 'short') {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '');
    }
    if (formatStyle === 'medium') {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    }
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', '');
}

function formatFullDate(dateStr: string, endDateStr?: string | null) {
    if (!dateStr) return '';
    const start = new Date(dateStr);
    const day = start.toLocaleDateString('en-US', { weekday: 'long' });
    const month = start.toLocaleDateString('en-US', { month: 'long' });
    const dayNum = start.getDate();
    const suffix = ["th", "st", "nd", "rd"][dayNum % 10 > 3 ? 0 : (dayNum % 100 - dayNum % 10 !== 10) ? dayNum % 10 : 0];
    const year = start.getFullYear();
    const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (endDateStr) {
        const end = new Date(endDateStr);
        const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return `${day}, ${month} ${dayNum}${suffix} ${year}, ${startTime} - ${endTime}`;
    }

    return `${day}, ${month} ${dayNum}${suffix} ${year}, started at ${startTime}`;
}

const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
const INITIAL_CASH = DENOMINATIONS.reduce((acc, den) => ({ ...acc, [den.toString()]: 0 }), {});
const MEMBERSHIP_NAME = import.meta.env.VITE_MEMBERSHIP_CARD_NAME || '[CONFIGURE MEMEBERSHIP IN ENVIRONMENT]';

export default function OfficeShiftShow({ shift, transactions, sellables, all_users }: any) {
    const { patch: endShift, processing: endingShift } = useForm({
        end_of_shift_cash_breakdown: [],
        notes: '',
    });

    const { patch: reopenShift, processing: reopeningShift } = useForm();
    const { patch: voidSale, processing: voidingSale } = useForm();

    const [selectedSellableId, setSelectedSellableId] = useState('');
    const [customSellableId, setCustomSellableId] = useState('custom');
    const [customPrice, setCustomPrice] = useState('0.00');
    const [customDescription, setCustomDescription] = useState('');
    const [esnCardStatus, setEsnCardStatus] = useState('without');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingSale, setPendingSale] = useState<any>(null);
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [cashModalOpen, setCashModalOpen] = useState(false);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [cashReceived, setCashReceived] = useState<Record<string, number>>(INITIAL_CASH);
    const [cashChangeGiven, setCashChangeGiven] = useState<Record<string, number>>(INITIAL_CASH);

    const handleEndShift = () => {
        endShift(shiftEndRoute({ shift: shift.id }).url);
    };

    const handleReopenShift = () => {
        reopenShift(shiftReopenRoute({ shift: shift.id }).url);
    };

    const handleVoid = (txId: string) => {
        voidSale(voidSaleRoute({ transaction: txId }).url);
    };

    const addWorker = (userId: string) => {
        router.post(`/office/shift/${shift.id}/workers`, { user_id: userId }, { preserveScroll: true });
    };

    const removeWorker = (userId: string) => {
        router.delete(`/office/shift/${shift.id}/workers/${userId}`, { preserveScroll: true });
    };

    const prepareSale = (method: 'pos_cash' | 'pos_card', isCustom: boolean) => {
        let price = 0;
        let sellable = null;
        let ticketType = esnCardStatus === 'with' ? 'with_membership' : 'regular';
        let snapshotName = '';

        if (isCustom) {
            if (!customPrice || isNaN(Number(customPrice))) return;
            price = Number(customPrice);

            if (customSellableId !== 'custom') {
                sellable = sellables.find((s: any) => s.id === customSellableId);
                snapshotName = customDescription || sellable.name;
            } else {
                snapshotName = customDescription || 'Custom Sale';
            }
        } else {
            if (!selectedSellableId) return;
            sellable = sellables.find((s: any) => s.id === selectedSellableId);

            if (esnCardStatus === 'with' && sellable.price_with_membership !== null) {
                price = Number(sellable.price_with_membership);
            } else if (esnCardStatus === 'without' && sellable.price_without_membership !== null) {
                price = Number(sellable.price_without_membership);
            } else {
                price = Number(sellable.price);
            }

            snapshotName = sellable.name;
        }

        const saleParams = {
            method,
            isCustom,
            sellable,
            price,
            ticketType,
            snapshotName,
            variantId: null,
        };

        setPendingSale(saleParams);

        if (sellable && sellable.is_variant_based && sellable.variants.length > 0) {
            setSelectedOptions({});
            setVariantModalOpen(true);
        } else if (method === 'pos_cash') {
            setCashReceived({ ...INITIAL_CASH });
            setCashChangeGiven({ ...INITIAL_CASH });
            setCashModalOpen(true);
        } else {
            submitSale(saleParams);
        }
    };

    const confirmVariant = () => {
        const variant = pendingSale.sellable.variants.find((v: any) => {
            return Object.keys(selectedOptions).every(key => v.options[key] === selectedOptions[key]);
        });

        if (!variant) return;

        const updatedSale = { ...pendingSale, variantId: variant.id };
        setPendingSale(updatedSale);
        setVariantModalOpen(false);

        if (updatedSale.method === 'pos_cash') {
            setCashReceived({ ...INITIAL_CASH });
            setCashChangeGiven({ ...INITIAL_CASH });
            setCashModalOpen(true);
        } else {
            submitSale(updatedSale);
        }
    };

    const confirmCashSale = () => {
        submitSale(pendingSale, { received: cashReceived, changeGiven: cashChangeGiven });
        setCashModalOpen(false);
    };

    const submitSale = (sale: any, cashData?: { received: Record<string, number>, changeGiven: Record<string, number> }) => {
        setIsSubmitting(true);
        let lineItem: any = {
            quantity: 1,
            subtotal: sale.price,
            unit_price: sale.price,
            ticket_type: sale.ticketType,
            snapshot: { name: sale.snapshotName },
        };

        if (sale.sellable) {
            lineItem.purchasable_id = sale.sellable.id;
            lineItem.purchasable_type = sale.sellable.type;
            if (sale.variantId) {
                lineItem.variant_id = sale.variantId;
            }
        } else {
            lineItem.purchasable_id = 'custom';
            lineItem.purchasable_type = 'Custom';
        }

        const payload: any = {
            payment_method: sale.method,
            lines: [lineItem]
        };

        if (sale.method === 'pos_cash') {
            if (cashData) {
                const tendered = Object.entries(cashData.received).reduce((sum, [den, count]) => sum + Number(den) * count, 0);
                const returned = Object.entries(cashData.changeGiven).reduce((sum, [den, count]) => sum + Number(den) * count, 0);
                payload.cash_tendered_amount = tendered;
                payload.cash_change_amount = returned;

                // You can add breakdowns if needed:
                payload.cash_tendered_breakdown = Object.entries(cashData.received)
                    .filter(([_, count]) => count > 0)
                    .map(([den, count]) => ({ denomination: Number(den), count }));

                payload.cash_change_breakdown = Object.entries(cashData.changeGiven)
                    .filter(([_, count]) => count > 0)
                    .map(([den, count]) => ({ denomination: Number(den), count }));
            } else {
                payload.cash_tendered_amount = sale.price;
                payload.cash_change_amount = 0;
            }
        }

        router.post(recordSaleRoute().url, payload, {
            onSuccess: () => {
                setSelectedSellableId('');
                setCustomPrice('0.00');
                setCustomDescription('');
                setCustomSellableId('custom');
                setEsnCardStatus('without');
                setCashReceived({ ...INITIAL_CASH });
                setCashChangeGiven({ ...INITIAL_CASH });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const adjustCash = (den: number, delta: number, type: 'received' | 'change') => {
        if (type === 'received') {
            setCashReceived(prev => {
                const current = prev[den.toString()] || 0;
                return { ...prev, [den.toString()]: Math.max(0, current + delta) };
            });
        } else {
            setCashChangeGiven(prev => {
                const current = prev[den.toString()] || 0;
                return { ...prev, [den.toString()]: Math.max(0, current + delta) };
            });
        }
    };

    // Modals data
    const variantKeys = pendingSale?.sellable?.variants
        ? Array.from(new Set(pendingSale.sellable.variants.flatMap((v: any) => Object.keys(v.options))))
        : [];

    const calculatedCashTotal = Object.entries(cashReceived).reduce((sum, [den, count]) => sum + Number(den) * count, 0);
    const calculatedChangeTotal = Object.entries(cashChangeGiven).reduce((sum, [den, count]) => sum + Number(den) * count, 0);
    const expectedCashAmount = pendingSale?.price || 0;
    const cashDiff = calculatedCashTotal - expectedCashAmount;

    // Valid if user provided enough cash. Change matching is optional.
    const isCashValid = calculatedCashTotal >= expectedCashAmount;

    // Calculate revenue numbers
    const startCash = Number(shift.start_cash_breakdown?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || shift.expected_cash_total);
    const startCard = 0.00;
    const startCombined = startCash + startCard;

    const liveCash = transactions.filter((tx: any) => tx.payment_method === 'pos_cash' && tx.status === 'completed').reduce((sum: number, tx: any) => sum + Number(tx.total_amount), 0);
    const liveCard = transactions.filter((tx: any) => tx.payment_method === 'pos_card' && tx.status === 'completed').reduce((sum: number, tx: any) => sum + Number(tx.total_amount), 0);
    const liveCombined = liveCash + liveCard;

    const totalCash = startCash + liveCash;
    const totalCard = startCard + liveCard;
    const totalCombined = startCombined + liveCombined;

    // Filter available workers
    const activeWorkerIds = shift.workers.map((w: any) => w.id);
    const availableUsers = all_users.filter((u: any) => !activeWorkerIds.includes(u.id));

    return (
        <>
            <Head title={`Office Shift: ${shift.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* Top Section */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">

                    {/* Workers Box */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border flex flex-col min-h-[25rem]">
                        <h3 className="mb-4 text-sm font-semibold">Workers</h3>
                        <div className="flex-1 overflow-y-auto pr-2">
                            <ul className="flex flex-col divide-y divide-sidebar-border/50">
                                {shift.workers.map((worker: any) => (
                                    <li key={worker.id} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex items-center justify-center rounded-full bg-muted/50 p-2">
                                                <UserIcon className="lucide lucide-user h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium whitespace-nowrap">{worker.name}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap capitalize">{worker.system_role || 'Member'}</span>
                                                {worker.id === shift.starter.id ? (
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 whitespace-nowrap dark:bg-green-900/40 dark:text-green-400">Started by</span>
                                                    </div>
                                                ) : worker.role === 'Closed by' ? (
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 whitespace-nowrap dark:bg-red-900/40 dark:text-red-400">Closed by</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" onClick={() => removeWorker(worker.id)} className="h-8 rounded-md px-3 text-muted-foreground hover:bg-muted/30 hover:text-accent-foreground text-sm font-medium">Remove</Button>
                                            <div className="text-sm text-neutral-600 dark:text-neutral-400">On shift</div>
                                        </div>
                                    </li>
                                ))}

                                {/* Available Users */}
                                {availableUsers.map((user: any) => (
                                    <li key={user.id} className="flex items-center justify-between py-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1 opacity-70">
                                            <div className="flex items-center justify-center rounded-full bg-muted/50 p-2">
                                                <UserIcon className="lucide lucide-user h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium whitespace-nowrap">{user.name}</span>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap capitalize">{user.title || 'Member'}</span>
                                                {user.id === shift.starter.id && (
                                                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 whitespace-nowrap dark:bg-green-900/40 dark:text-green-400">Started by</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={() => addWorker(user.id)} className="h-8 rounded-md px-3 shadow-xs bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium">Add</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Revenue Box */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border flex flex-col min-h-[25rem]">
                        <h3 className="mb-4 text-sm font-semibold">Revenue</h3>
                        <div className="flex-1 flex flex-col gap-6">

                            {/* Start of shift */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span>Start of shift</span>
                                    <span className="text-muted-foreground cursor-pointer">Hide</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Cash </span>
                                    <span className="font-semibold text-base">€{startCash.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Card </span>
                                    <span className="font-semibold text-base">€{startCard.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Combined</span>
                                    <span className="font-semibold text-base">€{startCombined.toFixed(2)}</span>
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            {/* Active office shift */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span>Active office shift</span>
                                    <span className="text-muted-foreground cursor-pointer">Hide</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Live Cash</span>
                                    <span className="font-semibold text-base">€{liveCash.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Live Card</span>
                                    <span className="font-semibold text-base">€{liveCard.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Combined</span>
                                    <span className="font-semibold text-base">€{liveCombined.toFixed(2)}</span>
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            {/* Total money */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-semibold">
                                    <span>Total money (start + live)</span>
                                    <span className="text-muted-foreground cursor-pointer">Hide</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Cash </span>
                                    <span className="font-semibold text-base">€{totalCash.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Card</span>
                                    <span className="font-semibold text-base">€{totalCard.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Combined</span>
                                    <span className="font-semibold text-base">€{totalCombined.toFixed(2)}</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Controls Box */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border flex flex-col min-h-[25rem]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-2">{formatFullDate(shift.started_at, shift.ended_at)}</h3>
                            <div className="flex gap-2 w-full">
                                {shift.status === 'open' ? (
                                    <>
                                        <Button variant="secondary" className="flex-1 opacity-50 cursor-not-allowed">Start shift</Button>
                                        <Button variant="outline" className="flex-1" onClick={handleEndShift} disabled={endingShift}>End shift</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="secondary" className="flex-1" onClick={handleReopenShift} disabled={reopeningShift}>Reopen shift</Button>
                                        <Button variant="outline" className="flex-1 opacity-50 cursor-not-allowed">End shift</Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {shift.status === 'open' && (
                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 mt-4">

                                <div className="space-y-2">
                                    <ToggleGroup type="single" value={esnCardStatus} onValueChange={(val) => { if (val) setEsnCardStatus(val) }} className="justify-start gap-2">
                                        <ToggleGroupItem value="with" aria-label={`With ${MEMBERSHIP_NAME}`} className="h-8 px-3 text-xs border border-border/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">With {MEMBERSHIP_NAME}</ToggleGroupItem>
                                        <ToggleGroupItem value="without" aria-label={`Without ${MEMBERSHIP_NAME}`} className="h-8 px-3 text-xs border border-border/50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Without {MEMBERSHIP_NAME}</ToggleGroupItem>
                                    </ToggleGroup>
                                </div>

                                {/* Quick Add Sale */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium">Quick add sale</span>
                                        <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Manage</span>
                                    </div>
                                    <Select value={selectedSellableId} onValueChange={setSelectedSellableId}>
                                        <SelectTrigger className="w-full text-sm">
                                            <SelectValue placeholder="Select an item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sellables.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} {s.is_variant_based ? '(Variants)' : ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => prepareSale('pos_cash', false)} disabled={isSubmitting || !selectedSellableId}>Add Cash</Button>
                                        <Button variant="outline" size="sm" onClick={() => prepareSale('pos_card', false)} disabled={isSubmitting || !selectedSellableId}>Add Card</Button>
                                    </div>
                                </div>

                                {/* Custom Sale */}
                                <div className="space-y-3">
                                    <span className="text-xs font-medium">Custom sale</span>
                                    <Select value={customSellableId} onValueChange={setCustomSellableId}>
                                        <SelectTrigger className="w-full text-sm">
                                            <SelectValue placeholder="Custom" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">Custom</SelectItem>
                                            {sellables.map((s: any) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name} {s.is_variant_based ? '(Variants)' : ''}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">€</span>
                                        <Input
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(e.target.value)}
                                            className="pl-7"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <Input
                                        value={customDescription}
                                        onChange={(e) => setCustomDescription(e.target.value)}
                                        placeholder="Description (mandatory)"
                                    />
                                    <div className="flex gap-2 pt-1">
                                        <Button variant="secondary" size="sm" onClick={() => prepareSale('pos_cash', true)} disabled={isSubmitting || !customPrice || (customSellableId === 'custom' && !customDescription)}>Add Cash</Button>
                                        <Button variant="outline" size="sm" onClick={() => prepareSale('pos_card', true)} disabled={isSubmitting || !customPrice || (customSellableId === 'custom' && !customDescription)}>Add Card</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Section: Sales Log */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold">Sales log</h3>
                        <span className="text-xs text-muted-foreground">
                            {transactions.reduce((acc: number, t: any) => acc + t.sales.length, 0)} sales
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border/40 text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-2 py-3 font-medium">ITEM</th>
                                    <th className="px-2 py-3 font-medium">METHOD</th>
                                    <th className="px-2 py-3 font-medium">AMOUNT</th>
                                    <th className="px-2 py-3 font-medium">DESCRIPTION</th>
                                    <th className="px-2 py-3 font-medium">SOLD BY</th>
                                    <th className="px-2 py-3 font-medium">SOLD AT</th>
                                    <th className="px-2 py-3 text-right"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx: any) => (
                                    tx.sales.map((sale: any) => (
                                        <tr key={sale.id} className="border-b border-border/20 last:border-0 hover:bg-muted/30">
                                            <td className="px-2 py-3">{sale.name} {sale.quantity > 1 && <span className="text-muted-foreground ml-1">x{sale.quantity}</span>}</td>
                                            <td className="px-2 py-3">
                                                <div className="flex gap-1.5 items-center">
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm font-normal h-5 border-border/50 ${tx.channel === 'online' ? 'bg-blue-600/20 text-blue-400 border-blue-600/30' : ''}`}>
                                                        {tx.channel === 'online' ? 'Online' : (tx.payment_method === 'pos_cash' ? 'Cash' : 'Card')}
                                                    </Badge>
                                                    {sale.ticket_type === 'with_membership' && (
                                                        <Badge variant="secondary" className="text-[10px] bg-white text-black hover:bg-white/90 px-1.5 py-0 rounded-sm font-medium h-5">{MEMBERSHIP_NAME}</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-sm">€{Number(sale.subtotal).toFixed(2)}</td>
                                            <td className="px-2 py-3 text-muted-foreground">{tx.status === 'refunded' ? 'Voided' : ''}</td>
                                            <td className="px-2 py-3">{shift.starter.name}</td>
                                            <td className="px-2 py-3 text-muted-foreground">{formatDate(tx.completed_at, 'medium')}</td>
                                            <td className="px-2 py-3 text-right">
                                                {shift.status === 'open' && tx.channel === 'pos' && tx.status === 'completed' && (
                                                    <button onClick={() => handleVoid(tx.id)} disabled={voidingSale} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">
                                            No recent sales to display.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {transactions.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan={7} className="px-2 py-4 text-right">
                                            <div className="flex justify-end gap-6 text-xs">
                                                <div className="text-right">
                                                    <p className="text-muted-foreground mb-0.5">Cash</p>
                                                    <p className="font-semibold text-sm">€{liveCash.toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground mb-0.5">Card</p>
                                                    <p className="font-semibold text-sm">€{liveCard.toFixed(2)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground mb-0.5">Total</p>
                                                    <p className="font-semibold text-sm">€{liveCombined.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Variant</DialogTitle>
                        <DialogDescription>Please select the options for {pendingSale?.sellable?.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {variantKeys.map(key => {
                            const values = Array.from(new Set(pendingSale.sellable.variants.map((v: any) => v.options[key as string])));
                            return (
                                <div key={key as string} className="space-y-2">
                                    <Label className="font-semibold">{key as string}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {values.map(val => (
                                            <Button
                                                key={val as string}
                                                size="sm"
                                                variant={selectedOptions[key as string] === val ? 'default' : 'outline'}
                                                onClick={() => setSelectedOptions(prev => ({ ...prev, [key as string]: val as string }))}
                                                className="rounded-full"
                                            >
                                                {val as string}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setVariantModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={confirmVariant}
                            disabled={variantKeys.some(k => !selectedOptions[k as string])}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cashModalOpen} onOpenChange={setCashModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Quick Sale Breakdown</DialogTitle>
                        <DialogDescription>Confirm the cash exchange.</DialogDescription>
                    </DialogHeader>

                    <div className="py-4 max-h-[50vh] overflow-y-auto pr-2">
                        <div className="flex justify-between items-center text-sm font-semibold mb-4 px-1">
                            <span className="flex-1">Cash Received</span>
                            {cashDiff < 0 && <span className="flex-1 text-right text-muted-foreground">Change Given Back</span>}
                        </div>

                        <div className="space-y-1">
                            {DENOMINATIONS.map(den => (
                                <div key={den} className="flex items-center py-1 px-1">
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className="w-16 font-medium">€{den >= 1 ? den : den.toFixed(2)}</span>
                                        <div className="flex items-center gap-4">
                                            <button
                                                className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-medium"
                                                onClick={() => adjustCash(den, -1, 'received')}
                                            >-</button>
                                            <span className="w-6 text-center text-sm tabular-nums font-semibold">{cashReceived[den.toString()] || 0}</span>
                                            <button
                                                className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-medium"
                                                onClick={() => adjustCash(den, 1, 'received')}
                                            >+</button>
                                        </div>
                                    </div>

                                    {cashDiff < 0 && (
                                        <>
                                            <div className="w-px h-6 bg-border mx-6" />
                                            <div className="flex items-center gap-4 flex-1 justify-end">
                                                <button
                                                    className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-medium"
                                                    onClick={() => adjustCash(den, -1, 'change')}
                                                >-</button>
                                                <span className="w-6 text-center text-sm tabular-nums font-semibold text-muted-foreground">{cashChangeGiven[den.toString()] || 0}</span>
                                                <button
                                                    className="h-6 w-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-medium"
                                                    onClick={() => adjustCash(den, 1, 'change')}
                                                >+</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Expected amount</span>
                            <span>€{expectedCashAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Calculated received</span>
                            <span>€{calculatedCashTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-3 text-muted-foreground">
                            <span>Change given</span>
                            <span>€{calculatedChangeTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border/50">
                            <span>Final Balance Diff</span>
                            <span className={!isCashValid ? 'text-red-500' : 'text-green-500'}>
                                {isCashValid ? 'Sufficient amount received' : `Missing €${Math.abs(cashDiff).toFixed(2)}`}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="ghost" onClick={() => setCashModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="secondary"
                            className="bg-white text-black hover:bg-white/90"
                            onClick={confirmCashSale}
                            disabled={isSubmitting || !isCashValid}
                        >
                            Save Sale
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

const LayoutWrapper = ({ children }: any) => {
    const { props } = usePage<any>();
    const shift = props.shift;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Office Shifts', href: officeRoute().url },
            { title: shift?.status === 'open' ? 'Active Shift' : `Closed Shift #${shift?.id}`, href: '#' },
        ]}>
            {children}
        </AppLayout>
    );
};

OfficeShiftShow.layout = (page: any) => <LayoutWrapper>{page}</LayoutWrapper>;
