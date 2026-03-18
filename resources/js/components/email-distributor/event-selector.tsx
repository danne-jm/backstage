import * as React from 'react';
import { Label } from '@/components/ui/label';

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
            <select
                id="event-select"
                value={selectedEventId || ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="w-full rounded-md border p-2 bg-background text-foreground"
            >
                <option value="" className="bg-white text-black">
                    -- Select event --
                </option>
                {events.length === 0 ? (
                    <option value="" disabled className="bg-white text-black">
                        No upcoming events
                    </option>
                ) : (
                    events.map((event) => {
                        const date = event.start_date || event.event_date;
                        return (
                            <option
                                key={event.id}
                                value={event.id}
                                className="bg-white text-black"
                            >
                                {event.name}
                                {date && ` (${String(date).slice(0, 10)})`}
                            </option>
                        );
                    })
                )}
            </select>
        </div>
    );
}
