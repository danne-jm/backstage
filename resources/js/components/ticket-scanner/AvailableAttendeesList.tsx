import * as React from 'react';

interface AvailableAttendeesListProps {
    attendeeGroups: any[];
    onSelectAttendee: (attendee: any) => void;
    selectedEventId: number | null;
    ticketsLoaded: boolean;
    eventName: string | undefined;
    ticketCount: number;
}

export function AvailableAttendeesList({
    attendeeGroups,
    onSelectAttendee,
    selectedEventId,
    ticketsLoaded,
    eventName,
    ticketCount,
}: AvailableAttendeesListProps) {
    return (
        <div className="order-2 flex flex-col rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border md:order-3">
            <h4 className="text-sm font-medium">
                {selectedEventId && ticketsLoaded
                    ? `Available tickets for ${eventName ?? ''}`
                    : 'Available tickets'}
            </h4>
            <div className="mb-2 text-xs text-muted-foreground">
                {selectedEventId && ticketsLoaded
                    ? ticketCount > 0
                        ? `${ticketCount} ticket${ticketCount !== 1 ? 's' : ''} remaining`
                        : 'No tickets remaining'
                    : null}
            </div>
            <div className="flex-1 overflow-y-auto bg-background text-sm max-h-[220px]">
                {attendeeGroups.length === 0 ? (
                    <div className="text-muted-foreground"></div>
                ) : (
                    <ul className="space-y-1">
                        {attendeeGroups.map((attendee, idx) => (
                            <li
                                key={idx}
                                onClick={() => onSelectAttendee(attendee)}
                                className="cursor-pointer rounded p-2 transition-colors hover:bg-muted/50"
                            >
                                <span className="font-medium">
                                    {attendee.first_name} {attendee.last_name}
                                </span>
                                <span className="ml-2 text-muted-foreground">
                                    x{attendee.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
