import React, { useState, useEffect } from 'react';
import { BaseModal } from '@backstage/components/office/base-modal';
import { Badge } from '@backstage/components/ui/badge';
import { Button } from '@backstage/components/ui/button';

interface SaleCashBreakdownModalProps {
    isOpen: boolean;
    onClose: (isOpen: boolean) => void;
    title: string;
    description?: string;
    expectedAmount?: number;
    initialBreakdown?: Record<string, number>;
    onSave: (
        breakdown: Record<string, number>,
        calculatedTotal: number,
    ) => void;
    isSubmitting?: boolean;
}

export function SaleCashBreakdownModal({
    isOpen,
    onClose,
    title,
    description,
    expectedAmount,
    onSave,
    isSubmitting = false,
    initialBreakdown = {},
}: SaleCashBreakdownModalProps) {
    const [breakdown, setBreakdown] = useState<Record<string, number>>({});

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setBreakdown(initialBreakdown || {});
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialBreakdown]);

    const denominations = [
        { key: '500e', label: '€500', value: 500 },
        { key: '200e', label: '€200', value: 200 },
        { key: '100e', label: '€100', value: 100 },
        { key: '50e', label: '€50', value: 50 },
        { key: '20e', label: '€20', value: 20 },
        { key: '10e', label: '€10', value: 10 },
        { key: '5e', label: '€5', value: 5 },
        { key: '2e', label: '€2', value: 2 },
        { key: '1e', label: '€1', value: 1 },
        { key: '50c', label: '50¢', value: 0.5 },
        { key: '20c', label: '20¢', value: 0.2 },
        { key: '10c', label: '10¢', value: 0.1 },
        { key: '5c', label: '5¢', value: 0.05 },
        { key: '2c', label: '2¢', value: 0.02 },
        { key: '1c', label: '1¢', value: 0.01 },
        { key: 'token', label: 'Pink Token', value: 0 },
    ];

    const calculateTotal = () => {
        return denominations.reduce((acc, denom) => {
            return acc + (breakdown[denom.key] || 0) * denom.value;
        }, 0);
    };

    const handleIncrement = (key: string) => {
        setBreakdown((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    };

    const handleDecrement = (key: string) => {
        setBreakdown((prev) => ({
            ...prev,
            [key]: Math.max(0, (prev[key] || 0) - 1),
        }));
    };

    const handleChange = (key: string, value: string) => {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed >= 0) {
            setBreakdown((prev) => ({ ...prev, [key]: parsed }));
        } else if (value === '') {
            setBreakdown((prev) => ({ ...prev, [key]: 0 }));
        }
    };

    const total = calculateTotal();
    const difference =
        expectedAmount !== undefined ? total - expectedAmount : 0;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={
                description || 'Provide the counts of bills, coins and tokens.'
            }
        >
            <div className="flex flex-col">
                <div className="custom-scrollbar max-h-[400px] space-y-3 overflow-y-auto border-b border-sidebar-border/50 pr-2 pb-4">
                    {denominations.map((denom) => (
                        <div
                            key={denom.key}
                            className="flex items-center justify-between"
                        >
                            <Badge
                                variant="outline"
                                className="border-sidebar-border/50 bg-transparent px-3 py-1 font-medium text-foreground"
                            >
                                {denom.label}
                            </Badge>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDecrement(denom.key)}
                                >
                                    -
                                </Button>
                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        breakdown[denom.key]?.toString() || '0'
                                    }
                                    onChange={(e) =>
                                        handleChange(denom.key, e.target.value)
                                    }
                                    className="h-8 w-16 rounded-md border border-sidebar-border/50 bg-transparent text-center text-sm"
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleIncrement(denom.key)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    {expectedAmount !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Expected amount
                            </span>
                            <span className="font-medium">
                                €{expectedAmount.toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            Calculated total
                        </span>
                        <span className="font-medium">€{total.toFixed(2)}</span>
                    </div>
                    {expectedAmount !== undefined && (
                        <div className="flex items-center justify-between text-sm font-semibold">
                            <span>Difference / Change</span>
                            <span
                                className={
                                    difference >= 0
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                }
                            >
                                {difference > 0 ? '+' : ''}€
                                {difference.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onClose(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSave(breakdown, total)}
                        disabled={isSubmitting}
                    >
                        Save Sale
                    </Button>
                </div>
            </div>
        </BaseModal>
    );
}
