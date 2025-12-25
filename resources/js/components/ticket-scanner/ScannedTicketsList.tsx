import * as React from 'react';

interface ScannedTicketsListProps {
    scannedTickets: any[];
    ticketsLoaded: boolean;
    selectedEventId: number | null;
    eventName: string | undefined;
    onSelectTicket: (ticket: any) => void;
}

export function ScannedTicketsList({
    scannedTickets,
    ticketsLoaded,
    selectedEventId,
    eventName,
    onSelectTicket,
}: ScannedTicketsListProps) {
    return (
        <div className="mt-6 min-h-[50vh] rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <div className="mb-3">
                <h4 className="text-sm font-medium">
                    Recently scanned
                    {ticketsLoaded && selectedEventId
                        ? ` for ${eventName ?? ''}`
                        : ''}
                </h4>
                {scannedTickets.length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                        {scannedTickets.length} ticket
                        {scannedTickets.length !== 1 ? 's' : ''} scanned
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground">
                        No scanned tickets yet
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                {scannedTickets.map((s, i) => {
                    const rawId = s.ticket_id ?? '';
                    const prettyId = rawId.replace(/_[0-9]{6,}_/, '_…_');
                    const scanCount = s.scan_count || 1;
                    return (
                        <div
                            key={s.id ?? s.ticket_id ?? i}
                            className="cursor-pointer rounded border p-3 transition-colors hover:bg-muted/50"
                            onClick={() => onSelectTicket(s)}
                        >
                            <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                                {prettyId}
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="font-medium">
                                    {s.first_name} {s.last_name}
                                </div>
                                {scanCount > 1 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        ×{scanCount}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {s.email}
                            </div>
                            <div className="mt-1 text-xs">
                                {s.event_name}{' '}
                                {s.event_date
                                    ? `(${new Date(s.event_date).toLocaleString()})`
                                    : ''}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
