import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import * as React from 'react';

interface AttendeeDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendee: any;
    allTickets: any[]; // The complete list of tickets for this attendee
}

export function AttendeeDetailsDialog({
    open,
    onOpenChange,
    attendee,
    allTickets,
}: AttendeeDetailsDialogProps) {
    if (!attendee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Attendee Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {attendee.first_name} {attendee.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {attendee.email}
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-2 text-sm font-medium">
                            Attendee Information
                        </h4>
                        <div className="space-y-2 rounded border bg-muted/30 p-3">
                            {allTickets[0] && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            First Name:
                                        </span>
                                        <span className="font-medium">
                                            {allTickets[0].first_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Last Name:
                                        </span>
                                        <span className="font-medium">
                                            {allTickets[0].last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Email:
                                        </span>
                                        <span className="font-medium">
                                            {allTickets[0].email}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-2 text-sm font-medium">
                            Tickets ({allTickets.length})
                        </h4>
                        <div className="space-y-2">
                            {allTickets.map((t, idx) => (
                                <div
                                    key={t.id || t.ticket_code || idx}
                                    className={`rounded border p-3 ${t.scan_count > 0 ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10' : 'bg-card'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-sm font-medium">
                                                {t.ticket_code}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {t.event_name}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`text-xs font-medium ${t.scan_count > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                                            >
                                                {t.scan_count > 0
                                                    ? `Scanned x${t.scan_count}`
                                                    : 'Not Scanned'}
                                            </div>
                                            {t.scanned_at && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    Latest:{' '}
                                                    {new Date(
                                                        t.scanned_at,
                                                    ).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {t.scan_details &&
                                        t.scan_details.length > 0 && (
                                            <div className="mt-2 border-t pt-2">
                                                <div className="mb-1 text-xs font-medium text-muted-foreground">
                                                    Scan History:
                                                </div>
                                                <div className="max-h-24 overflow-y-auto">
                                                    {t.scan_details.map(
                                                        (
                                                            d: any,
                                                            dIdx: number,
                                                        ) => (
                                                            <div
                                                                key={dIdx}
                                                                className="flex justify-between text-[10px]"
                                                            >
                                                                <span>
                                                                    {d.timestamp}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {d.user_email ||
                                                                        'System'}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
