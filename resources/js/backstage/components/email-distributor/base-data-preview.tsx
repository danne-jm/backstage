import * as React from 'react';

/**
 * Base component for data preview tables
 * Provides reusable structure for displaying tabular data
 */
interface Column<T> {
    key: keyof T | string;
    label: string;
    width?: string;
    render?: (item: T, index: number) => React.ReactNode;
}

interface BaseDataPreviewProps<T> {
    data: T[];
    columns: Column<T>[];
    maxRows?: number;
    emptyMessage?: string;
    className?: string;
}

export function BaseDataPreview<T extends Record<string, any>>({
    data,
    columns,
    maxRows = 10,
    emptyMessage = 'No data available',
    className = '',
}: BaseDataPreviewProps<T>) {
    const displayData = data.slice(0, maxRows);

    if (data.length === 0) {
        return (
            <div className="rounded border p-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full table-fixed text-xs">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={String(col.key) + idx}
                                className={`pr-2 text-left ${col.width || ''}`}
                                style={col.width ? { width: col.width } : {}}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayData.map((item, rowIndex) => (
                        <tr key={rowIndex} className="border-t">
                            {columns.map((col, colIndex) => {
                                const value = col.render
                                    ? col.render(item, rowIndex)
                                    : String(item[col.key] ?? '');

                                return (
                                    <td key={colIndex} className="py-1 pr-2">
                                        <span
                                            className="inline-block w-full truncate"
                                            title={String(value)}
                                        >
                                            {value}
                                        </span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length > maxRows && (
                <div className="mt-2 text-xs text-muted-foreground">
                    Showing {maxRows} of {data.length} rows
                </div>
            )}
        </div>
    );
}
