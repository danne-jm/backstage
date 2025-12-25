import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import * as React from 'react';

interface ScanResultDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scanModal: {
        status: 'legit' | 'already' | 'false';
        ticket?: any;
        raw?: string;
        wasScanning?: boolean;
    } | null;
    allTickets: any[];
}

export function ScanResultDialog({
    open,
    onOpenChange,
    scanModal,
    allTickets,
}: ScanResultDialogProps) {
    if (!scanModal) return null;

    const formatScanDate = (iso?: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString(); // Use consistent locale formatting
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {scanModal.ticket
                            ? `${scanModal.ticket.first_name} ${scanModal.ticket.last_name}`
                            : 'Scanned QR'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`h-3 w-3 rounded-full ${scanModal.status === 'legit' ? 'bg-green-600' : scanModal.status === 'already' ? 'bg-orange-500' : 'bg-red-600'}`}
                        />
                        <span className="text-sm text-muted-foreground">
                            {scanModal.status === 'legit'
                                ? 'Legitimate ticket'
                                : scanModal.status === 'already'
                                    ? 'Already scanned'
                                    : 'Unknown / invalid'}
                        </span>
                    </div>

                    {scanModal.ticket ? (
                        <div className="space-y-3 rounded border p-3">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Ticket ID
                                </div>
                                <div
                                    className="truncate break-words font-mono text-sm"
                                    title={scanModal.ticket.ticket_id ?? ''}
                                >
                                    {(() => {
                                        const rawId =
                                            scanModal.ticket.ticket_id ?? '';
                                        if (rawId.length > 24) {
                                            return (
                                                rawId.slice(0, 12) +
                                                '…' +
                                                rawId.slice(-8)
                                            );
                                        }
                                        return rawId;
                                    })()}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Name
                                </div>
                                <div className="font-medium">
                                    {scanModal.ticket.first_name}{' '}
                                    {scanModal.ticket.last_name}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Email
                                </div>
                                <div className="text-sm">
                                    {scanModal.ticket.email}
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                Event:{' '}
                                {scanModal.ticket.event_name || 'Unknown'}{' '}
                                {scanModal.ticket.event_date
                                    ? `(${new Date(scanModal.ticket.event_date).toLocaleString()})`
                                    : ''}
                            </div>

                            {scanModal.status === 'already' &&
                                scanModal.ticket.scan_details &&
                                Array.isArray(scanModal.ticket.scan_details) &&
                                scanModal.ticket.scan_details.length > 0 && (
                                    <div className="border-t pt-3">
                                        <div className="mb-2 text-xs text-muted-foreground">
                                            Scan History
                                        </div>
                                        <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
                                            {[...scanModal.ticket.scan_details]
                                                .reverse()
                                                .map((d: any, idx: number) => (
                                                    <li
                                                        key={idx}
                                                        className="flex justify-between gap-2"
                                                    >
                                                        <span className="truncate overflow-ellipsis">
                                                            {d.user_email ??
                                                                'unknown'}
                                                        </span>
                                                        <span className="whitespace-nowrap text-muted-foreground">
                                                            {formatScanDate(
                                                                d.timestamp,
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                        </ul>
                                    </div>
                                )}

                            {allTickets.length > 0 && (
                                <div className="border-t pt-3">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        All tickets Under This Email (
                                        {allTickets.length})
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {allTickets.map((ticket, idx) => (
                                            <div
                                                key={
                                                    ticket.id ??
                                                    ticket.ticket_id ??
                                                    idx
                                                }
                                                className={`rounded p-2 ${ticket.scan_count > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">
                                                            {ticket.first_name}{' '}
                                                            {ticket.last_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {(
                                                                ticket.ticket_id ??
                                                                ''
                                                            ).replace(
                                                                /_[0-9]{6,}_/,
                                                                '_…_',
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {ticket.email}
                                                        </div>
                                                    </div>
                                                    {ticket.scan_count > 0 && (
                                                        <span className="whitespace-nowrap text-xs font-medium text-green-600 dark:text-green-400">
                                                            ✓ Scanned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="rounded border p-4">
                            <div className="break-words whitespace-pre-wrap text-sm">
                                {scanModal.raw}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
