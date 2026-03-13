import * as React from 'react';
import { Button } from '@/components/ui/button';
import { SellableDialogBase } from '@/components/sellables/sellable-dialog-base';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface FilterRule {
    column: string;
    operator: string;
    value: string;
}

interface AttendeeFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filterConfig: FilterRule[];
    headers: string[];
    saveFilterConfig: (config: FilterRule[]) => void;
}

const OPERATORS = [
    { label: 'Equals', value: 'equals' },
    { label: 'Contains', value: 'contains' },
    { label: 'Does not contain', value: 'not_contains' },
    { label: 'Is Checked', value: 'is_checked' },
    { label: 'Is Not Checked', value: 'is_not_checked' },
    { label: 'Is Empty', value: 'is_empty' },
    { label: 'Is Not Empty', value: 'is_not_empty' },
];

export function AttendeeFilterDialog({
    open,
    onOpenChange,
    filterConfig,
    headers,
    saveFilterConfig,
}: AttendeeFilterDialogProps) {
    // Local draft — only committed on explicit Save
    const [draft, setDraft] = React.useState<FilterRule[]>(filterConfig);

    // Reset draft to current saved config whenever dialog opens
    React.useEffect(() => {
        if (open) setDraft(filterConfig);
    }, [open]);

    const addFilterRule = () => {
        setDraft([...draft, { column: '', operator: 'equals', value: '' }]);
    };

    const removeFilterRule = (index: number) => {
        setDraft(draft.filter((_, i) => i !== index));
    };

    const updateFilterRule = (index: number, field: keyof FilterRule, value: string) => {
        const newDraft = [...draft];
        newDraft[index] = { ...newDraft[index], [field]: value } as FilterRule;
        setDraft(newDraft);
    };

    const handleSave = () => {
        saveFilterConfig(draft);
    };

    return (
        <SellableDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title="Filter Configuration"
            description="Define rules for identifying valid attendees. Changes are only applied when you click Save."
            onSubmit={handleSave}
            submitLabel="Save Configuration"
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {draft.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                        No filter rules set. All attendees will be imported.
                    </div>
                )}
                {draft.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className="grid flex-1 grid-cols-3 gap-2">
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:ring-1 focus:ring-ring focus:outline-none"
                                value={rule.column}
                                onChange={(e) => updateFilterRule(idx, 'column', e.target.value)}
                            >
                                <option value="" disabled>Select Column</option>
                                {headers.map((h) => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>

                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:ring-1 focus:ring-ring focus:outline-none"
                                value={rule.operator}
                                onChange={(e) => updateFilterRule(idx, 'operator', e.target.value)}
                            >
                                {OPERATORS.map((op) => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>

                            {!['is_checked', 'is_not_checked', 'is_empty', 'is_not_empty'].includes(rule.operator) && (
                                <Input
                                    placeholder="Value..."
                                    value={rule.value}
                                    onChange={(e) => updateFilterRule(idx, 'value', e.target.value)}
                                />
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilterRule(idx)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={addFilterRule}
                    className="w-full border-dashed"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Rule
                </Button>
            </div>
        </SellableDialogBase>
    );
}
