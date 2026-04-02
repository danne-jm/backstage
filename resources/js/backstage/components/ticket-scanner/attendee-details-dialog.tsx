import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@backstage/components/ui/collapsible';
import { Button } from '@backstage/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@backstage/components/ui/dialog';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';

interface AttendeeDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    attendee: any;
    allTickets: any[]; // The complete list of tickets for this attendee
    onVerify?: (ticketCode: string) => void;
}

export function AttendeeDetailsDialog({
    open,
    onOpenChange,
    attendee,
    allTickets,
    onVerify,
}: AttendeeDetailsDialogProps) {
    if (!attendee) return null;
    const [isOpen, setIsOpen] = React.useState(false);
    
    // Sort so current event's tickets or primary tickets come first or are highlighted?
    // The request said: "make it clear which ticket in tthat list is the currently opened ticket in the modal youre viewing from."
    // In this dialog, we are viewing an attendee, not a specific ticket initially, but usually the first one is of interest.
    // However, the interface suggests we click an attendee from the list.
    
    // Let's assume there is no "currently opened ticket" in this specific dialog context yet, 
    // unless we clicked a specific ticket to get here? 
    // Actually the `onSelectAttendee` passes an attendee group object.
    
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
                        <div className="space-y-3 rounded border bg-muted/30 p-3">
                            {allTickets[0] && (
                                <>
                                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-muted-foreground">
                                            First Name:
                                        </span>
                                        <span className="font-medium">
                                            {allTickets[0].first_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-muted-foreground">
                                            Last Name:
                                        </span>
                                        <span className="font-medium">
                                            {allTickets[0].last_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-muted-foreground">
                                            Email:
                                        </span>
                                        <span className="font-medium break-all">
                                            {allTickets[0].email}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {allTickets.length > 0 && (
                        <div className="space-y-4">
                            {allTickets.length > 1 ? (
                                <Collapsible
                                    open={isOpen}
                                    onOpenChange={setIsOpen}
                                    className="space-y-2"
                                >
                                    <div className="flex items-center justify-between space-x-4 px-1 pb-2 pt-3 border-t">
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
                                                <span className="sr-only">
                                                    Toggle
                                                </span>
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent className="max-h-[300px] divide-y overflow-y-auto rounded border bg-background">
                                        {allTickets.map((t, idx) => (
                                            <TicketItem
                                                key={
                                                    t.id || t.ticket_code || idx
                                                }
                                                t={t}
                                                onVerify={onVerify}
                                                isCurrent={false}
                                            />
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <div>
                                    <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Ticket Details
                                    </h4>
                                    <div className="max-h-[300px] divide-y overflow-y-auto rounded border bg-background">
                                        <TicketItem
                                            t={allTickets[0]}
                                            onVerify={onVerify}
                                            isCurrent={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function TicketItem({
    t,
    onVerify,
    isCurrent,
}: {
    t: any;
    onVerify?: (code: string) => void;
    isCurrent: boolean;
}) {
    return (
        <div
            className={`relative rounded-md p-3 transition-colors hover:bg-muted/50 ${
                isCurrent
                    ? 'bg-primary/5 ring-1 ring-primary'
                    : 'border border-transparent bg-card'
            } ${t.scan_count > 0 && !isCurrent ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}
        >
            {isCurrent && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md bg-primary"></div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                        {t.first_name} {t.last_name}
                        {isCurrent && (
                            <span className="text-xs font-bold text-primary">
                                (Current)
                            </span>
                        )}
                    </div>
                    <div className="text-xs break-all text-muted-foreground">
                        {(() => {
                            const code = t.ticket_code ?? t.ticket_id ?? '';
                            const parts = code.split('_to_');
                            if (parts.length > 1) {
                                return '...' + parts.slice(1).join('_to_');
                            }
                            return code.replace(/_[0-9]{6,}_/, '_…_');
                        })()}
                    </div>
                    <div className="text-xs break-all text-muted-foreground">
                        {t.email}
                    </div>
                </div>
                <div className="text-left sm:text-right">
                    <div
                        className={`text-xs font-medium ${t.scan_count > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                    >
                        {t.scan_count > 0
                            ? `Scanned x${t.scan_count}`
                            : 'Not Scanned'}
                    </div>
                    {/* Manual Check-in Button Commented Out As Requested
                    {onVerify && !t.scan_count && (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="mt-1 h-6 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onVerify(t.ticket_code);
                            }}
                        >
                            Manual Check-in
                        </Button>
                    )}
                    */}
                    {t.scanned_at && (
                        <div className="text-[10px] text-muted-foreground">
                            Latest: {new Date(t.scanned_at).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
