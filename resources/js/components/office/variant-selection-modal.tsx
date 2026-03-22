import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (variantId: string) => void;
    sellable: {
        name: string;
        variants_config?: Array<{
            name: string;
            options: string[];
        }>;
        variants?: Array<{
            id: string;
            options: Record<string, string>;
            remaining: number | null;
        }>;
    } | null;
    initialOptions?: Record<string, string>;
}

export function VariantSelectionModal({
    isOpen,
    onClose,
    onConfirm,
    sellable,
    initialOptions,
}: VariantSelectionModalProps) {
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >({});

    // Reset selection when modal opens or sellable changes
    React.useEffect(() => {
        if (isOpen) {
            setSelectedOptions(initialOptions || {});
        }
    }, [isOpen, sellable, initialOptions]);

    const configs = useMemo(() => sellable?.variants_config || [], [sellable]);
    const variants = useMemo(() => sellable?.variants || [], [sellable]);

    const handleSelectOption = (configName: string, option: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [configName]: option,
        }));
    };

    // Find the matching variant based on selected options
    const matchedVariant = useMemo(() => {
        if (Object.keys(selectedOptions).length !== configs.length) return null;

        return variants.find((v) => {
            return configs.every(
                (config) =>
                    v.options[config.name] === selectedOptions[config.name],
            );
        });
    }, [selectedOptions, configs, variants]);

    const isOutOfStock =
        matchedVariant &&
        matchedVariant.remaining !== null &&
        matchedVariant.remaining <= 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Variant</DialogTitle>
                    <DialogDescription>
                        Please select the options for {sellable?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {configs.map((config) => (
                        <div key={config.name} className="space-y-3">
                            <h4 className="text-sm leading-none font-medium">
                                {config.name}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {config.options.map((option) => {
                                    const isSelected =
                                        selectedOptions[config.name] === option;

                                    // Check if this option is available given other selections
                                    // (Simplified check: at least one variant exists with this option set and matching other selections)
                                    const isAvailable = variants.some((v) => {
                                        if (v.options && v.options[config.name] !== option)
                                            return false;
                                        // For other configs, if selected, they must match
                                        return configs.every((c) => {
                                            if (c.name === config.name)
                                                return true;
                                            if (!selectedOptions[c.name])
                                                return true;
                                            return (
                                                v.options && v.options[c.name] ===
                                                selectedOptions[c.name]
                                            );
                                        });
                                    });

                                    return (
                                        <Button
                                            key={option}
                                            variant={
                                                isSelected
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                handleSelectOption(
                                                    config.name,
                                                    option,
                                                )
                                            }
                                            className={cn(
                                                'h-8 transition-all',
                                                !isAvailable &&
                                                'cursor-not-allowed opacity-30',
                                            )}
                                            disabled={!isAvailable}
                                        >
                                            {option}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {matchedVariant && (
                    <div className="py-2 text-center text-sm">
                        {isOutOfStock ? (
                            <span className="font-semibold text-destructive">
                                Out of Stock
                            </span>
                        ) : matchedVariant.remaining !== null ? (
                            <span className="text-muted-foreground">
                                {matchedVariant.remaining} remaining
                            </span>
                        ) : (
                            <span className="text-muted-foreground">
                                Unlimited stock
                            </span>
                        )}
                    </div>
                )}

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() =>
                            matchedVariant && onConfirm(matchedVariant.id)
                        }
                        disabled={!matchedVariant || !!isOutOfStock}
                    >
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
