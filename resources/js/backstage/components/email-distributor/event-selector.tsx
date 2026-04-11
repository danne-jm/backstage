import * as React from 'react';
import { Label } from '@backstage/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';

/**
 * Event selector component
 * Dropdown for selecting an event
 */
interface Event {
    id: string;
    name: string;
    start_date?: string;
    event_date?: string;
}

interface EventSelectorProps {
    events: Event[];
    selectedEventId: string | null;
    onChange: (eventId: string | null) => void;
}

export function EventSelector({
    events,
    selectedEventId,
    onChange,
}: EventSelectorProps) {
    return (
        <div className="flex max-w-[320px] min-w-[220px] flex-1 flex-col space-y-2">
            <Label htmlFor="event-select">Event</Label>
            <Select
                value={selectedEventId || ''}
                onValueChange={(val) => onChange(val || null)}
            >
                <SelectTrigger id="event-select" className="w-full">
                    <SelectValue placeholder="-- Select event --" />
                </SelectTrigger>
                <SelectContent>
                    {events.length === 0 ? (
                        <SelectItem value="" disabled>
                            No upcoming events
                        </SelectItem>
                    ) : (
                        events.map((event) => {
                            const date = event.start_date || event.event_date;
                            return (
                                <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                    {date && ` (${String(date).slice(0, 10)})`}
                                </SelectItem>
                            );
                        })
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
