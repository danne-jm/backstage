import { X } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@backstage/components/ui/badge';
import { Input } from '@backstage/components/ui/input';
import { cn } from '@backstage/lib/utils';

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
    const [inputValue, setInputValue] = React.useState('');
    const [createdOptions, setCreatedOptions] = React.useState<string[]>([]);

    const lowerSelected = React.useMemo(
        () => selected.map((s) => s.toLowerCase()),
        [selected],
    );

    const masterOptions = React.useMemo(() => {
        const unique = new Set([...options, ...createdOptions]);
        return Array.from(unique).sort();
    }, [options, createdOptions]);

    const filteredOptions = React.useMemo(() => {
        const term = inputValue.trim().toLowerCase();
        return masterOptions.filter((opt) => {
            const lower = opt.toLowerCase();
            if (lowerSelected.includes(lower)) return false;
            if (!term) return true;
            return lower.includes(term);
        });
    }, [masterOptions, inputValue, lowerSelected]);

    const handleToggle = (category: string) => {
        const lower = category.toLowerCase();
        if (lowerSelected.includes(lower)) {
            onChange(selected.filter((s) => s.toLowerCase() !== lower));
        } else {
            onChange([...selected, category]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const term = inputValue.trim();
        if (!term) return;

        const exactMatch = filteredOptions.find(
            (opt) => opt.toLowerCase() === term.toLowerCase(),
        );

        if (exactMatch) {
            handleToggle(exactMatch);
        } else if (!lowerSelected.includes(term.toLowerCase())) {
            onChange([...selected, term]);
            setCreatedOptions((prev) => [...prev, term]);
            setInputValue('');
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
                {filteredOptions.length > 0
                    ? filteredOptions.map((opt) => (
                          <button
                              key={opt}
                              type="button"
                              onClick={() => handleToggle(opt)}
                              className="rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                              {opt}
                          </button>
                      ))
                    : inputValue && (
                          <p className="text-sm text-muted-foreground">
                              Press Enter to add "{inputValue}"
                          </p>
                      )}
            </div>
        </div>
    );
}
