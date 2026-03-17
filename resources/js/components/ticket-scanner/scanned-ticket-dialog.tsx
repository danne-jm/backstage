import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';

interface ScannedTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: any;
    allTickets: any[];
}

export function ScannedTicketDialog({
    open,
    onOpenChange,
    ticket,
    allTickets,
}: ScannedTicketDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    
    if (!ticket) return null;

    const formatScanDate = (iso?: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Scanned Ticket Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {ticket.first_name} {ticket.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {ticket.email}
                        </p>
                    </div>

                    <div className="space-y-3 rounded border bg-muted/30 p-3">
                        <div>
                            <div className="text-xs text-muted-foreground">
                                Ticket ID
                            </div>
                            <div className="font-mono text-sm break-all">
                                {(() => {
                                    const code =
                                        ticket.ticket_code ??
                                        ticket.ticket_id ??
                                        '';
                                    const parts = code.split('_to_');
                                    if (parts.length > 1) {
                                        return (
                                            '...' + parts.slice(1).join('_to_')
                                        );
                                    }
                                    return code.replace(/_[0-9]{6,}_/, '_…_');
                                })()}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-muted-foreground">
                                First Name:
                            </span>
                            <span className="font-medium">
                                {ticket.first_name}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-muted-foreground">
                                Last Name:
                            </span>
                            <span className="font-medium">
                                {ticket.last_name}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-muted-foreground">
                                Email:
                            </span>
                            <span className="font-medium break-all">
                                {ticket.email}
                            </span>
                        </div>
                        {ticket.nationality && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Nationality:
                                </span>
                                <span className="font-medium">
                                    {ticket.nationality}
                                </span>
                            </div>
                        )}
                        {ticket.esn_card !== undefined && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    ESN Card:
                                </span>
                                <span className="font-medium">
                                    {ticket.esn_card ? 'Yes' : 'No'}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Scan Count:
                            </span>
                            <span className="font-medium">
                                {ticket.scan_count || 0}
                            </span>
                        </div>
                    </div>

                    {ticket.scan_details &&
                        Array.isArray(ticket.scan_details) &&
                        ticket.scan_details.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-medium">
                                    Scan History
                                </h4>
                                <div className="max-h-[300px] divide-y overflow-y-auto rounded border">
                                    {[...ticket.scan_details]
                                        .reverse()
                                        .map((d: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col gap-1 p-3 sm:flex-row sm:justify-between"
                                            >
                                                <span className="text-sm break-all">
                                                    {d.user_email ?? 'unknown'}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatScanDate(
                                                        d.timestamp,
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                    {allTickets.length > 1 && (
                        <Collapsible
                            open={isOpen}
                            onOpenChange={setIsOpen}
                            className="space-y-2 pt-3 border-t"
                        >
                            <div className="flex items-center justify-between space-x-4 px-1 pb-2">
                                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    All Tickets Under This Email ({allTickets.length})
                                </h4>
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-9 p-0"
                                    >
                                        {isOpen ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="max-h-[300px] divide-y overflow-y-auto rounded border bg-background">
                                {allTickets.map((t, idx) => {
                                    const isCurrent =
                                        t.ticket_code === ticket.ticket_code ||
                                        t.id === ticket.id;
                                    return (
                                        <div
                                            key={t.id ?? t.ticket_id ?? idx}
                                            className={`p-3 relative transition-colors ${
                                                isCurrent
                                                    ? 'bg-primary/5'
                                                    : 'hover:bg-muted/50'
                                            } ${t.scan_count > 0 && !isCurrent ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
                                        >
                                            {isCurrent && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                            )}
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                                                <div>
                                                    <div className="text-sm font-medium flex items-center gap-2">
                                                        {t.first_name}{' '}
                                                        {t.last_name}
                                                        {isCurrent && (
                                                            <span className="text-xs font-bold text-primary">
                                                                (Current)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs break-all text-muted-foreground">
                                                        {(() => {
                                                            const code =
                                                                t.ticket_code ??
                                                                t.ticket_id ??
                                                                '';
                                                            const parts =
                                                                code.split(
                                                                    '_to_',
                                                                );
                                                            if (
                                                                parts.length > 1
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
                                                        {t.email}
                                                    </div>
                                                </div>
                                                {t.scan_count > 0 && (
                                                    <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                                                        ✓ Scanned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
