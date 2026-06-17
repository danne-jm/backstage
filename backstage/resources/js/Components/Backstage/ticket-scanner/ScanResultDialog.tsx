import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/Components/Shared/ui/dialog';

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
                        <div className="space-y-3 rounded border bg-muted/30 p-3">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Ticket ID
                                </div>
                                <div className="font-mono text-sm break-all">
                                    {(() => {
                                        const code =
                                            scanModal.ticket.ticket_code ??
                                            scanModal.ticket.ticket_id ??
                                            '';
                                        const parts = code.split('_to_');
                                        if (parts.length > 1) {
                                            return (
                                                '...' +
                                                parts.slice(1).join('_to_')
                                            );
                                        }
                                        return code.replace(
                                            /_[0-9]{6,}_/,
                                            '_…_',
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-muted-foreground">
                                    First Name:
                                </span>
                                <span className="font-medium">
                                    {scanModal.ticket.first_name}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-muted-foreground">
                                    Last Name:
                                </span>
                                <span className="font-medium">
                                    {scanModal.ticket.last_name}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-muted-foreground">
                                    Email:
                                </span>
                                <span className="font-medium break-all">
                                    {scanModal.ticket.email}
                                </span>
                            </div>

                            {scanModal.ticket.nationality && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Nationality:
                                    </span>
                                    <span className="font-medium">
                                        {scanModal.ticket.nationality}
                                    </span>
                                </div>
                            )}
                            {scanModal.ticket.esn_card !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        ESN Card:
                                    </span>
                                    <span className="font-medium">
                                        {scanModal.ticket.esn_card
                                            ? 'Yes'
                                            : 'No'}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Scan Count:
                                </span>
                                <span className="font-medium">
                                    {scanModal.ticket.scan_count || 0}
                                </span>
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
                                                        className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-2"
                                                    >
                                                        <span className="truncate break-all overflow-ellipsis">
                                                            {d.user_email ??
                                                                'unknown'}
                                                        </span>
                                                        <span className="text-muted-foreground">
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
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <div className="font-medium">
                                                            {ticket.first_name}{' '}
                                                            {ticket.last_name}
                                                        </div>
                                                        <div className="text-xs break-all text-muted-foreground">
                                                            {(() => {
                                                                const code =
                                                                    ticket.ticket_code ??
                                                                    ticket.ticket_id ??
                                                                    '';
                                                                const parts =
                                                                    code.split(
                                                                        '_to_',
                                                                    );
                                                                if (
                                                                    parts.length >
                                                                    1
                                                                ) {
                                                                    return (
                                                                        '...' +
                                                                        parts
                                                                            .slice(
                                                                                1,
                                                                            )
                                                                            .join(
                                                                                '_to_',
                                                                            )
                                                                    );
                                                                }
                                                                return code.replace(
                                                                    /_[0-9]{6,}_/,
                                                                    '_…_',
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="text-xs break-all text-muted-foreground">
                                                            {ticket.email}
                                                        </div>
                                                    </div>
                                                    {ticket.scan_count > 0 && (
                                                        <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
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
                            <div className="text-sm break-words whitespace-pre-wrap">
                                {scanModal.raw}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
