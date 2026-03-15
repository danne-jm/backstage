import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { BaseDataPreview } from './base-data-preview';
import { RecipientSummary } from './recipient-summary';

/**
 * Data source preview component
 * Shows preview of attendee data with full data dialog
 */
interface DataSourcePreviewProps {
    data: Record<string, any>[];
    fields: string[];
    firstNameField: string;
    lastNameField: string;
    emailField: string;
    verificationActions?: React.ReactNode;
    emailVerificationResults?: Record<number, any>;
    validationResults?: Record<number, boolean | null>;
    isFiltered?: boolean;
}

export function DataSourcePreview({
    data,
    fields,
    firstNameField,
    lastNameField,
    emailField,
    verificationActions,
    emailVerificationResults = {},
    validationResults = {},
    isFiltered = false,
}: DataSourcePreviewProps) {
    const previewColumns = React.useMemo(
        () => [
            {
                key: firstNameField,
                label: firstNameField,
                width: 'w-[6.5rem] min-w-[6.5rem]',
            },
            {
                key: lastNameField,
                label: lastNameField,
                width: 'w-[6.5rem] min-w-[6.5rem]',
            },
            {
                key: emailField,
                label: emailField,
            },
        ],
        [firstNameField, lastNameField, emailField]
    );

    const fullColumns = fields.map((field) => ({
        key: field,
        label: field,
    }));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">
                    {isFiltered ? 'Filtered Data Source' : 'Data Source Preview'}
                </h4>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                            Manage
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="flex h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-4 sm:!max-w-[95vw]">
                        <DialogTitle>{isFiltered ? 'Filtered Data Source' : 'Full Data Source'}</DialogTitle>
                        <DialogDescription>
                            <div className="text-xs text-muted-foreground">
                                Total entries: {data.length}
                            </div>
                        </DialogDescription>

                        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                            <div className="grid h-full min-h-0 grid-cols-3 gap-4">
                                {/* Full data table */}
                                <div className="col-span-2 min-h-0">
                                    <div className="h-full max-h-[75vh] overflow-y-auto rounded border">
                                        <table className="w-full table-fixed text-xs">
                                            <thead>
                                                <tr>
                                                    {fields.map((field) => (
                                                        <th
                                                            key={field}
                                                            className="sticky top-0 z-10 border-b bg-background/95 pr-2 text-left text-xs backdrop-blur-sm"
                                                        >
                                                            {field}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((row, idx) => {
                                                    const rowIdx = idx + 1; // 1-based index
                                                    const res = emailVerificationResults[rowIdx];
                                                    // ONLY highlight RED if invalid. No green background for valid.
                                                    const bgColor = res && res.valid === false ? 'bg-red-100/30' : '';

                                                    return (
                                                        <tr
                                                            key={idx}
                                                            className={`border-t ${bgColor}`}
                                                        >
                                                            {fields.map((field) => (
                                                                <td
                                                                    key={field}
                                                                    className="py-1 pr-2 align-top text-xs"
                                                                >
                                                                    <span
                                                                        className="inline-block w-full truncate"
                                                                        title={String(
                                                                            row[
                                                                            field
                                                                            ] ?? ''
                                                                        )}
                                                                    >
                                                                        {String(
                                                                            row[
                                                                            field
                                                                            ] ?? ''
                                                                        )}
                                                                    </span>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Recipient summary */}
                                <div className="col-span-1 min-h-0">
                                    <RecipientSummary
                                        data={data}
                                        emailField={emailField}
                                        actions={verificationActions}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button>Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <BaseDataPreview
                data={data}
                columns={previewColumns}
                maxRows={10}
                emptyMessage="No data loaded. Select an event to load attendees."
            />
        </div>
    );
}
