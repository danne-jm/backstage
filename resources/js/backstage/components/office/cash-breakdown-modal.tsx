import React from 'react';
import { BaseModal } from '@backstage/components/office/base-modal';
import { Badge } from '@backstage/components/ui/badge';

interface CashBreakdownModalProps {
    isOpen: boolean;
    onClose: (isOpen: boolean) => void;
    title: string;
    description?: string;
    totalAmount: number;
    breakdown?: Record<string, number>;
}

const DENOMINATIONS = [
    { key: '500e', label: '€500' },
    { key: '200e', label: '€200' },
    { key: '100e', label: '€100' },
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

export function CashBreakdownModal({
    isOpen,
    onClose,
    title,
    description,
    totalAmount,
    breakdown = {},
}: CashBreakdownModalProps) {

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
        >
            <div className="flex flex-col">
                <div className="custom-scrollbar max-h-[500px] space-y-4 overflow-y-auto pr-2">
                    {DENOMINATIONS.map((denom) => (
                        <div
                            key={denom.key}
                            className="flex items-center justify-between text-sm"
                        >
                            <Badge
                                variant="outline"
                                className="border-sidebar-border/50 bg-transparent px-3 py-1 font-medium text-foreground"
                            >
                                {denom.label}
                            </Badge>
                            <span className="font-semibold">
                                {(breakdown || {})[denom.key] || 0}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-sidebar-border/50 pt-4">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold">
                        €{totalAmount.toFixed(2)}
                    </span>
                </div>
            </div>
        </BaseModal>
    );
}

// Variant that only shows denominations that were actually used (count > 0).
// Used on store-manager pages; office pages continue to use CashBreakdownModal
// which shows the full list including zeros.
export function SparseCashBreakdownModal({
    isOpen,
    onClose,
    title,
    description,
    totalAmount,
    breakdown = {},
}: CashBreakdownModalProps) {
    const usedDenoms = DENOMINATIONS.filter(
        (denom) => (breakdown || {})[denom.key] && (breakdown || {})[denom.key]! > 0,
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
        >
            <div className="flex flex-col">
                <div className="custom-scrollbar max-h-[500px] space-y-4 overflow-y-auto pr-2">
                    {usedDenoms.length === 0 ? (
                        <div className="py-2 text-sm text-muted-foreground">
                            No cash breakdown recorded for this sale.
                        </div>
                    ) : (
                        usedDenoms.map((denom) => (
                            <div
                                key={denom.key}
                                className="flex items-center justify-between text-sm"
                            >
                                <Badge
                                    variant="outline"
                                    className="border-sidebar-border/50 bg-transparent px-3 py-1 font-medium text-foreground"
                                >
                                    {denom.label}
                                </Badge>
                                <span className="font-semibold">
                                    {(breakdown || {})[denom.key] || 0}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-sidebar-border/50 pt-4">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-lg font-bold">
                        €{totalAmount.toFixed(2)}
                    </span>
                </div>
            </div>
        </BaseModal>
    );
}
