import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface EmailVerificationResult {
    valid: boolean;
    reason: string;
}

interface AttendeeTableProps {
    headers: string[];
    rows: any[][];
    purchaseIdentifierColIndex: number;
    validationResults: Record<number, boolean | null>;
    emailColIndex?: number;
    emailVerificationResults?: Record<number, EmailVerificationResult>;
}

export function AttendeeTable({
    headers,
    rows,
    purchaseIdentifierColIndex,
    validationResults,
    emailColIndex = -1,
    emailVerificationResults = {},
}: AttendeeTableProps) {
    if (headers.length === 0 || rows.length === 0) {
        return (
            <div className="flex h-24 items-center justify-center text-center text-muted-foreground">
                No data found in the configured spreadsheet.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((header, idx) => (
                            <TableHead key={idx} className="whitespace-nowrap">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                            {row.map((cell, cellIdx) => {
                                let bgStyle: React.CSSProperties = {};

                                // Payment validation coloring on purchase_identifier column
                                if (cellIdx === purchaseIdentifierColIndex) {
                                    const result = validationResults[rowIdx];
                                    if (result === true) {
                                        bgStyle = { backgroundColor: 'rgba(147, 196, 125, 0.3)' };
                                    } else if (result === false) {
                                        bgStyle = { backgroundColor: 'rgba(234, 153, 153, 0.3)' };
                                    }
                                }

                                // Email verification coloring on email column
                                if (emailColIndex >= 0 && cellIdx === emailColIndex) {
                                    const verification = emailVerificationResults[rowIdx];
                                    if (verification !== undefined && verification.valid === false) {
                                        bgStyle = { backgroundColor: 'rgba(234, 153, 153, 0.3)' }; // red only
                                    }
                                }

                                return (
                                    <TableCell
                                        key={cellIdx}
                                        style={bgStyle}
                                        className="whitespace-nowrap"
                                        title={
                                            emailColIndex >= 0 &&
                                                cellIdx === emailColIndex &&
                                                emailVerificationResults[rowIdx]
                                                ? emailVerificationResults[rowIdx].reason
                                                : undefined
                                        }
                                    >
                                        {cell ?? ''}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
