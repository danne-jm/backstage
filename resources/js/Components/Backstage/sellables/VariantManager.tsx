import { Button } from '@/Components/Shared/ui/button';
import { Input } from '@/Components/Shared/ui/input';
import { Label } from '@/Components/Shared/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/Shared/ui/table';
import { SellableVariant, VariantConfigItem } from '@/types/sellables';
import { Plus, Trash, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface VariantManagerProps {
    initialConfig?: VariantConfigItem[] | null;
    initialVariants?: SellableVariant[] | null;
    onChange: (
        config: VariantConfigItem[],
        variants: SellableVariant[],
    ) => void;
}

export function VariantManager({
    initialConfig = [],
    initialVariants = [],
    onChange,
}: VariantManagerProps) {
    const [config, setConfig] = React.useState<VariantConfigItem[]>(
        initialConfig || [],
    );
    const [variants, setVariants] = React.useState<SellableVariant[]>(
        initialVariants || [],
    );

    // Helper to generate combinations
    const generateCombinations = (
        attributes: VariantConfigItem[],
    ): Record<string, string>[] => {
        if (attributes.length === 0) return [];

        const [first, ...rest] = attributes;
        const suffixes = generateCombinations(rest);
        const combinations: Record<string, string>[] = [];

        first.options.forEach((option) => {
            if (suffixes.length === 0) {
                combinations.push({ [first.name]: option });
            } else {
                suffixes.forEach((suffix) => {
                    combinations.push({
                        [first.name]: option,
                        ...suffix,
                    });
                });
            }
        });

        return combinations;
    };

    // Re-generate list of variants when config changes
    useEffect(() => {
        const combinations = generateCombinations(
            config.filter((c) => c.name && c.options.length > 0),
        );

        const newVariants: SellableVariant[] = combinations.map((combo) => {
            // Check if we already have this variant to preserve quantity/id
            // Sort keys to ensure reliable comparison
            const existing = variants.find((v) => {
                const keys1 = Object.keys(v.options).sort();
                const keys2 = Object.keys(combo).sort();
                if (keys1.length !== keys2.length) return false;
                if (!keys1.every((k, i) => k === keys2[i])) return false;
                return keys1.every((k) => v.options[k] === combo[k]);
            });

            if (existing) {
                return existing;
            }

            return {
                options: combo,
                quantity: null, // Default to unlimited
            };
        });

        // Trigger change up ONLY if different (to avoid loop, check lengths or deep eq?)
        // For simplicity, we just set internal state for display, and parent gets updated on specific actions?
        // Actually, we should keep `variants` in sync with the generated list, but ONLY if the list of combinations technically changed.
        // However, user input (quantity) also changes `variants`.

        // Current issue: This effect runs on `config` change.
        // If we update `variants` state here, we risk loops if not careful, but `variants` isn't in dependency array.
        // We only want to 're-sync' variants list when config structure changes.

        // Let's compare newVariants with current variants (sans quantity updates) to see if structure changed.
        const structureChanged =
            newVariants.length !== variants.length ||
            !newVariants.every((nv, i) => {
                const ov = variants[i];
                // quick check options equality
                return JSON.stringify(nv.options) === JSON.stringify(ov?.options);
            });

        if (structureChanged) {
            setVariants(newVariants);
            onChange(config, newVariants);
        }
    }, [config]);

    // Manual update of variant quantity
    const updateVariantQuantity = (index: number, val: string) => {
        const newVariants = [...variants];
        if (val === '') {
            newVariants[index].quantity = null;
        } else {
            newVariants[index].quantity = parseInt(val) || 0;
        }
        setVariants(newVariants);
        onChange(config, newVariants);
    };

    const addAttribute = () => {
        setConfig([...config, { name: '', options: [] }]);
    };

    const removeAttribute = (index: number) => {
        const newConfig = [...config];
        newConfig.splice(index, 1);
        setConfig(newConfig);
        // Effect will handle variant list update
    };

    const updateAttributeName = (index: number, name: string) => {
        const newConfig = [...config];
        newConfig[index].name = name;
        setConfig(newConfig);
    };

    const addOption = (index: number, option: string) => {
        if (!option) return;
        const newConfig = [...config];
        if (!newConfig[index].options.includes(option)) {
            newConfig[index].options.push(option);
            setConfig(newConfig);
        }
    };

    const removeOption = (attrIndex: number, optionToRemove: string) => {
        const newConfig = [...config];
        newConfig[attrIndex].options = newConfig[attrIndex].options.filter(
            (o) => o !== optionToRemove,
        );
        setConfig(newConfig);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Variant Attributes</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAttribute}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Attribute
                    </Button>
                </div>
                {config.map((attr, idx) => (
                    <div
                        key={idx}
                        className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                    >
                        <div className="flex items-end gap-4">
                            <div className="flex-1 space-y-2">
                                <Label>Attribute Name</Label>
                                <Input
                                    placeholder="e.g. Size, Color"
                                    value={attr.name}
                                    onChange={(e) =>
                                        updateAttributeName(idx, e.target.value)
                                    }
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Options (Press Enter)</Label>
                                <Input
                                    placeholder="Type option and press Enter"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addOption(
                                                idx,
                                                e.currentTarget.value,
                                            );
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeAttribute(idx)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {attr.options.map((opt) => (
                                <div
                                    key={opt}
                                    className="flex items-center gap-1 rounded-md bg-zinc-800 px-3 py-1 text-sm font-medium text-white shadow-sm"
                                >
                                    {opt}
                                    <button
                                        type="button"
                                        onClick={() => removeOption(idx, opt)}
                                        className="ml-1 text-gray-400 hover:text-white"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {variants.length > 0 && (
                <div className="space-y-2">
                    <Label>Inventory Matrix</Label>
                    <p className="text-sm text-gray-500">
                        Leave quantity empty for unlimited stock.
                    </p>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {config
                                        .filter((c) => c.name)
                                        .map((c) => (
                                            <TableHead key={c.name}>
                                                {c.name}
                                            </TableHead>
                                        ))}
                                    <TableHead>Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map((variant, idx) => (
                                    <TableRow key={idx}>
                                        {config
                                            .filter((c) => c.name)
                                            .map((c) => (
                                                <TableCell key={c.name}>
                                                    {variant.options[c.name]}
                                                </TableCell>
                                            ))}
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="w-32"
                                                placeholder="Unlimited"
                                                value={
                                                    variant.quantity === null
                                                        ? ''
                                                        : variant.quantity
                                                }
                                                onChange={(e) =>
                                                    updateVariantQuantity(
                                                        idx,
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
