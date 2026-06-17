import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import * as React from 'react';
import useSWR from 'swr';

const denominationConfig = [
    { key: '50e', label: '€50' },
    { key: '20e', label: '€20' },
    { key: '10e', label: '€10' },
    { key: '5e', label: '€5' },
    { key: '2e', label: '€2' },
    { key: '1e', label: '€1' },
    { key: '50c', label: '50¢' },
    { key: '20c', label: '20¢' },
    { key: '10c', label: '10¢' },
    { key: '5c', label: '5¢' },
    { key: '2c', label: '2¢' },
    { key: '1c', label: '1¢' },
    { key: 'token', label: 'Pink Token' },
];

const defaultCashState = {
    '50e': 0,
    '20e': 0,
    '10e': 0,
    '5e': 0,
    '2e': 0,
    '1e': 0,
    '50c': 0,
    '20c': 0,
    '10c': 0,
    '5c': 0,
    '2c': 0,
    '1c': 0,
    token: 0,
};

export const useOfficeShift = () => {
    const { props: initialProps, version } = usePage<SharedData>();
    const [props, setProps] = React.useState(initialProps);

    const fetcher = (url: string) =>
        axios
            .get(url, {
                headers: {
                    'X-Inertia': 'true',
                    'X-Inertia-Version': version,
                },
            })
            .then((res) => res.data);

    const { mutate } = useSWR(
        (initialProps.activeShift as any)
            ? `/office/${(initialProps.activeShift as any).id}`
            : null,
        fetcher,
        {
            refreshInterval: 2000,
            onSuccess: (newData) => {
                if (newData?.props) {
                    setProps(newData.props);
                }
            },
        },
    );

    const rawSellables = props['sellables'];
    const sellables = React.useMemo(
        () => (Array.isArray(rawSellables) ? rawSellables : []),
        [rawSellables],
    );
    const activeShift: any = props['activeShift'] ?? null;

    const isEventInSellWindow = React.useCallback((item: any) => {
        if (!item) return false;
        if (item.type !== 'event') return true;

        const now = new Date();

        if (item.start_sell_date) {
            const start = new Date(item.start_sell_date);
            if (!isNaN(start.getTime()) && now.getTime() < start.getTime()) {
                return false;
            }
        }

        if (item.end_sell_date) {
            const end = new Date(item.end_sell_date);
            if (!isNaN(end.getTime()) && now.getTime() > end.getTime()) {
                return false;
            }
        }

        return true;
    }, []);

    const filteredSellables = React.useMemo(
        () => sellables.filter((s) => isEventInSellWindow(s)),
        [sellables, isEventInSellWindow],
    );

    const [workers, setWorkers] = React.useState<any[]>([]);
    const [sales, setSales] = React.useState<any[]>([]);
    const [submitting, setSubmitting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        if (activeShift) {
            setSales(activeShift.sales || []);
            setWorkers(activeShift.workers || []);
        }
    }, [activeShift]);

    const rawStaff = props['staff'];
    const staff = React.useMemo(
        () => (Array.isArray(rawStaff) ? rawStaff : []),
        [rawStaff],
    );
    const staffMap = React.useMemo(
        () => new Map(staff.map((s: any) => [s.email, s.name])),
        [staff],
    );

    const staffData = (Array.isArray(props['staff']) ? props['staff'] : []).map(
        (m: any) => ({
            id: m.id,
            name: String(m.name || ''),
            role: String(m.role ?? ''),
            email: String(m.email ?? ''),
            onShift: Boolean((workers || []).find((w: any) => w.id === m.id)),
        }),
    );

    staffData.sort((a: any, b: any) => {
        if (a.onShift === b.onShift) return a.name.localeCompare(b.name);
        return a.onShift ? -1 : 1;
    });

    const [saleProductId, setSaleProductId] = React.useState<number | null>(
        filteredSellables.length ? filteredSellables[0].actual_id : null,
    );
    const [saleItemType, setSaleItemType] = React.useState<'product' | 'event'>(
        filteredSellables.length ? filteredSellables[0].type : 'product',
    );
    const [saleTicketType, setSaleTicketType] = React.useState<
        'with_card' | 'without_card'
    >('with_card');

    React.useEffect(() => {
        if (filteredSellables.length) {
            setSaleProductId(filteredSellables[0].actual_id ?? null);
            setSaleItemType(filteredSellables[0].type ?? 'product');
        } else {
            setSaleProductId(null);
            setSaleItemType('product');
        }
    }, [filteredSellables]);

    const [customSaleItemId, setCustomSaleItemId] =
        React.useState<string>('custom');
    const [customAmount, setCustomAmount] = React.useState('');
    const [customDescription, setCustomDescription] = React.useState('');

    const cashTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'cash')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const cardTotal = (sales || [])
        .filter((s: any) => String(s.method).toLowerCase() === 'card')
        .reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);
    const combinedTotal = cashTotal + cardTotal;

    const [startTotals, setStartTotals] = React.useState<{
        cash: number;
        card: number;
    }>({
        cash: Number(activeShift?.start_cash ?? 0),
        card: Number(activeShift?.start_card ?? 0),
    });

    const [isSoldOutModalOpen, setIsSoldOutModalOpen] = React.useState(false);
    const [soldOutText, setSoldOutText] = React.useState('');

    const totalCash = Number(startTotals.cash ?? 0) + cashTotal;
    const totalCard = Number(startTotals.card ?? 0) + cardTotal;
    const totalCombined = totalCash + totalCard;

    const addCardSale = () => {
        if (!saleProductId || !activeShift) return;
        const selectedItem = filteredSellables.find(
            (i: any) => i.actual_id === saleProductId,
        );
        if (!selectedItem) return;

        let amountToUse = '0';
        let itemName = selectedItem.name;
        if (selectedItem.type === 'product') {
            amountToUse = String(selectedItem.price);
        } else {
            amountToUse =
                saleTicketType === 'with_card'
                    ? String(selectedItem.price_with_card)
                    : String(selectedItem.price_without_card);
            itemName += ` (${saleTicketType === 'with_card' ? 'with' : 'without'} ESN card)`;
        }

        const ticketLabel =
            selectedItem.type === 'event'
                ? saleTicketType === 'with_card'
                    ? 'With ESNcard'
                    : 'Without ESNcard'
                : '';
        const tempId = `tmp-${Date.now()}`;
        const tempSale: any = {
            id: tempId,
            name: itemName,
            method: 'card',
            amount: Number(amountToUse),
            description: '',
            ticket_type:
                selectedItem.type === 'event' ? saleTicketType : undefined,
            ticket_label: ticketLabel || undefined,
        };

        setSales((prev) => [tempSale, ...(prev || [])]);
        setSubmitting(true);

        axios
            .post('/online-sales', {
                office_shift_id: activeShift?.id,
                product_id:
                    selectedItem.type === 'product' ? saleProductId : null,
                event_id: selectedItem.type === 'event' ? saleProductId : null,
                method: 'card',
                amount: amountToUse,
                ticket_type:
                    selectedItem.type === 'event' ? saleTicketType : undefined,
                ticket_label: ticketLabel || undefined,
            })
            .then(() => {
                setMessage('Sale recorded (Card)');
                mutate();
            })
            .catch((err: any) => {
                setSales((prev) =>
                    (prev || []).filter((s: any) => s.id !== tempId),
                );
                const status = err?.response?.status;
                const stockErr = err?.response?.data?.errors?.stock;
                if (status === 422 && stockErr) {
                    const text = Array.isArray(stockErr)
                        ? stockErr.join(' | ')
                        : String(stockErr);
                    setSoldOutText(text);
                    setIsSoldOutModalOpen(true);
                } else {
                    setMessage('Failed to record sale');
                }
            })
            .finally(() => setSubmitting(false));
    };

    const addCustomCardSale = () => {
        if (!activeShift || !customAmount || !customDescription) return;
        const isCustom = customSaleItemId === 'custom';
        const selectedItem = isCustom
            ? null
            : filteredSellables.find((i: any) => i.id === customSaleItemId);
        const amountToUse = String(customAmount);
        const descToUse = String(customDescription || '');
        const itemName = selectedItem ? selectedItem.name : 'Custom Sale';
        const tempId = `tmp-${Date.now()}`;
        const tempSale: any = {
            id: tempId,
            name: itemName,
            method: 'card',
            amount: Number(amountToUse),
            description: descToUse,
        };
        setSales((prev) => [tempSale, ...(prev || [])]);
        setSubmitting(true);

        axios
            .post('/online-sales', {
                office_shift_id: activeShift?.id,
                product_id:
                    selectedItem && selectedItem.type === 'product'
                        ? selectedItem.actual_id
                        : null,
                event_id:
                    selectedItem && selectedItem.type === 'event'
                        ? selectedItem.actual_id
                        : null,
                method: 'card',
                amount: amountToUse,
                description: descToUse,
            })
            .then(() => {
                setMessage('Custom sale recorded (Card)');
                setCustomSaleItemId('custom');
                setCustomAmount('');
                setCustomDescription('');
                mutate();
            })
            .catch((err: any) => {
                setSales((prev) =>
                    (prev || []).filter((s: any) => s.id !== tempId),
                );
                const status = err?.response?.status;
                const stockErr = err?.response?.data?.errors?.stock;
                if (status === 422 && stockErr) {
                    const text = Array.isArray(stockErr)
                        ? stockErr.join(' | ')
                        : String(stockErr);
                    setSoldOutText(text);
                    setIsSoldOutModalOpen(true);
                } else {
                    setMessage('Failed to record custom sale');
                }
            })
            .finally(() => setSubmitting(false));
    };

    return {
        props,
        activeShift,
        sellables: filteredSellables,
        workers,
        setWorkers,
        sales,
        setSales,
        submitting,
        setSubmitting,
        message,
        setMessage,
        staffData,
        staffMap,
        saleProductId,
        setSaleProductId,
        saleItemType,
        setSaleItemType,
        saleTicketType,
        setSaleTicketType,
        customSaleItemId,
        setCustomSaleItemId,
        customAmount,
        setCustomAmount,
        customDescription,
        setCustomDescription,
        cashTotal,
        cardTotal,
        combinedTotal,
        startTotals,
        setStartTotals,
        totalCash,
        totalCard,
        totalCombined,
        addCardSale,
        addCustomCardSale,
        isSoldOutModalOpen,
        setIsSoldOutModalOpen,
        soldOutText,
        setSoldOutText,
        denominationConfig,
        defaultCashState,
        mutate,
    };
};
