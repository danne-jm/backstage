import * as React from 'react';
import { Label } from '@backstage/components/ui/label';

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
            <select
                id={`field-${label}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full rounded-md border p-2 bg-background text-foreground"
            >
                <option value="" className="bg-white text-black">
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                        className="bg-white text-black"
                    >
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}
