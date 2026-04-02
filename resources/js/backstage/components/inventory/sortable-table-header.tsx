import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type SortDir = 'asc' | 'desc';

interface SortableTableHeaderProps<TColumn extends string> {
    label: string;
    column: TColumn;
    activeColumn: TColumn | null;
    direction: SortDir;
    onSort: (column: TColumn) => void;
    className?: string;
}

/**
 * Renders a <th> with a clickable sort button.
 * Shows the active sort icon when this column is sorted, otherwise shows a dimmed indicator.
 */
export function SortableTableHeader<TColumn extends string>({
    label,
    column,
    activeColumn,
    direction,
    onSort,
    className,
}: SortableTableHeaderProps<TColumn>) {
    const isActive = activeColumn === column;

    return (
        <th className={className}>
            <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => onSort(column)}
            >
                <span>{label}</span>
                {isActive ? (
                    direction === 'asc' ? (
                        <ChevronUpIcon size={14} />
                    ) : (
                        <ChevronDownIcon size={14} />
                    )
                ) : (
                    <ChevronUpIcon size={14} className="opacity-30" />
                )}
            </button>
        </th>
    );
}
