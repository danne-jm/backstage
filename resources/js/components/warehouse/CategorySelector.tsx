import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface CategorySelectorProps {
    selected: string[];
    onChange: (categories: string[]) => void;
    options: string[];
    className?: string;
}

export function CategorySelector({
    selected,
    onChange,
    options,
    className,
}: CategorySelectorProps) {
    const [inputValue, setInputValue] = useState('');
    // Track locally created options so they persist in the list if untoggled
    const [createdOptions, setCreatedOptions] = useState<string[]>([]);

    const lowerSelected = useMemo(
        () => selected.map((s) => s.toLowerCase()),
        [selected],
    );

    // Combine props options with locally created ones, ensuring uniqueness
    const masterOptions = useMemo(() => {
        const unique = new Set([...options, ...createdOptions]);
        return Array.from(unique).sort();
    }, [options, createdOptions]);

    const filteredOptions = useMemo(() => {
        const term = inputValue.trim().toLowerCase();
        // Filter master options by search term AND exclude currently selected items
        return masterOptions.filter((opt) => {
            const lower = opt.toLowerCase();
            const isSelected = lowerSelected.includes(lower);
            if (isSelected) return false; // Hide if selected (shown as tag above)
            if (!term) return true; // Show all remaining if blank
            return lower.includes(term);
        });
    }, [masterOptions, inputValue, lowerSelected]);

    const handleToggle = (category: string) => {
        const lower = category.toLowerCase();
        if (lowerSelected.includes(lower)) {
            // Remove
            onChange(selected.filter((s) => s.toLowerCase() !== lower));
        } else {
            // Add
            onChange([...selected, category]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const term = inputValue.trim();
            if (!term) return;

            // Check if exact match exists in filtered (available) options
            const exactMatch = filteredOptions.find(
                (opt) => opt.toLowerCase() === term.toLowerCase(),
            );

            if (exactMatch) {
                handleToggle(exactMatch);
            } else {
                // Add as new category
                // Check if already selected (case-insensitive) to prevent duplicates
                if (!lowerSelected.includes(term.toLowerCase())) {
                    onChange([...selected, term]);
                    // Add to created options so it appears in list if removed later
                    setCreatedOptions((prev) => [...prev, term]);
                }
                setInputValue('');
            }
        }
    };

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <div className="flex flex-wrap gap-2">
                {selected.map((cat) => (
                    <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                        {cat}
                        <button
                            type="button"
                            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                            onClick={() => handleToggle(cat)}
                        >
                            <X size={12} />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                placeholder="Type to filter or add..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="flex flex-wrap gap-2">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleToggle(opt)}
                            className="rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            {opt}
                        </button>
                    ))
                ) : (
                    inputValue && (
                        <div className="text-sm text-muted-foreground">
                            Press Enter to add "{inputValue}"
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
