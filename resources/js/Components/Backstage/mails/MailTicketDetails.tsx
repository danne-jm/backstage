import { format } from 'date-fns';

interface MailTicketDetailsProps {
    loading: boolean;
    ticketData: any;
}

export function MailTicketDetails({
    loading,
    ticketData,
}: MailTicketDetailsProps) {
    return (
        <div className="bg-muted/50 p-4">
            {loading && <p>Loading ticket data...</p>}
            {ticketData?.error && (
                <p className="text-red-500">{ticketData.error}</p>
            )}
            {ticketData && !ticketData.error && (
                <div>
                    <h4 className="mb-2 font-semibold">Ticket Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Ticket Code:
                            </span>{' '}
                            {ticketData.ticket_code}
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Unique Trait:
                            </span>{' '}
                            {ticketData.unique_trait}
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Scan Count:
                            </span>{' '}
                            {ticketData.scan_count}
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Scanned At:
                            </span>{' '}
                            {ticketData.scanned_at
                                ? format(
                                      new Date(ticketData.scanned_at),
                                      'yyyy-MM-dd HH:mm',
                                  )
                                : 'Not scanned'}
                        </div>
                        {ticketData.scan_details && (
                            <div>
                                <span className="font-medium text-muted-foreground">
                                    Scan Details:
                                </span>{' '}
                                <pre className="rounded-md bg-background p-2 text-xs">
                                    {JSON.stringify(
                                        ticketData.scan_details,
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
