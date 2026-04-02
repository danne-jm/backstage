import { format } from 'date-fns';
import { Badge } from '@backstage/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@backstage/components/ui/card';

interface MailTicketDetailsProps {
    loading: boolean;
    ticketData: any;
    mail: any;
}

/**
 * Expandable row content showing full mail content (subject, body) 
 * and ticket details for QR-linked mail entries.
 */
export function MailTicketDetails({ loading, ticketData, mail }: MailTicketDetailsProps) {
    const isQrMail = mail.metadata && mail.metadata.__ticket_id;

    return (
        <div className="bg-muted/30 p-6 border-b border-border/40 space-y-4">
            {/* Subject Header - Top of view */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</span>
                    {isQrMail ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">Ticket</Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Text</Badge>
                    )}
                </div>
                <h3 className="text-base font-semibold text-foreground">{mail.subject || 'No Subject'}</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Mail Content (Left Side - 2/3 width on large) */}
                <div className="lg:col-span-2">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Message</span>
                        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:text-gray-100 max-h-[500px] overflow-y-auto">
                            <div
                                className="prose max-w-none dark:prose-invert text-sm text-gray-800 dark:text-gray-200"
                                dangerouslySetInnerHTML={{
                                    __html: mail.body || '<p className="text-muted-foreground">No content.</p>'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Ticket Details (Right Side - 1/3 width on large) */}
                {isQrMail && (
                    <div className="lg:col-span-1 min-w-0">
                        <Card className="shadow-sm border border-border/60">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ticket Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loading && <p className="text-sm text-muted-foreground">Loading ticket data...</p>}

                                {ticketData?.error && (
                                    <p className="text-sm text-red-500">{ticketData.error}</p>
                                )}

                                {ticketData && !ticketData.error && (
                                    <div className="divide-y divide-border/40 space-y-3">
                                        <div className="pt-0">
                                            <span className="text-xs text-muted-foreground block">Ticket Code</span>
                                            <div className="mt-1 overflow-x-auto max-w-full rounded border border-border/40 bg-muted px-1.5 py-0.5">
                                                <code className="text-xs font-mono break-all leading-relaxed whitespace-pre ">
                                                    {ticketData.ticket_code}
                                                </code>
                                            </div>
                                        </div>
                                        <div className="pt-3">
                                            <span className="text-xs text-muted-foreground block">Unique Trait</span>
                                            <span className="text-sm font-medium">{ticketData.unique_trait}</span>
                                        </div>
                                        <div className="pt-3 flex justify-between items-center">
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Scan Count</span>
                                                <span className="text-sm font-medium">{ticketData.scan_count}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Scanned At</span>
                                                <span className="text-sm font-medium">
                                                    {ticketData.scanned_at
                                                        ? format(new Date(ticketData.scanned_at), 'yyyy-MM-dd HH:mm')
                                                        : 'Not scanned'}
                                                </span>
                                            </div>
                                        </div>
                                        {ticketData.scan_details && (
                                            <div className="pt-3">
                                                <span className="text-xs text-muted-foreground block mb-1">Scan Details</span>
                                                <pre className="max-h-[150px] overflow-y-auto rounded-md bg-muted/50 p-2 border border-border/40 text-[11px] font-mono">
                                                    {JSON.stringify(ticketData.scan_details, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
