import * as React from 'react';
import { Label } from '@backstage/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';

/**
 * Base component for field mapping dropdowns
 * Provides reusable structure for mapping data fields
 */
interface BaseFieldMapperProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    description?: string;
}

export function BaseFieldMapper({
    label,
    value,
    onChange,
    options,
    placeholder = '— No mapping available —',
    description,
}: BaseFieldMapperProps) {
    return (
        <div>
            <Label htmlFor={`field-${label}`}>{label}</Label>
            {description && (
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            )}
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id={`field-${label}`} className="mt-1 w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
