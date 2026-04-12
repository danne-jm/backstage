import { router } from '@inertiajs/react';
import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import { Input } from '@backstage/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';

interface MailFiltersProps {
    events: { id: number; name: string }[];
    senders: { id: number; email: string }[];
    initialFilters: {
        event_id?: string;
        user_id?: string;
        type?: string;
        start_date?: string;
        end_date?: string;
    };
    totalMails: number;
}

export function MailFilters({
    events,
    senders,
    initialFilters,
    totalMails,
}: MailFiltersProps) {
    const [eventFilter, setEventFilter] = React.useState(initialFilters.event_id || '');
    const [senderFilter, setSenderFilter] = React.useState(initialFilters.user_id || '');
    const [typeFilter, setTypeFilter] = React.useState(initialFilters.type || '');
    const [startDateFilter, setStartDateFilter] = React.useState(initialFilters.start_date || '');
    const [endDateFilter, setEndDateFilter] = React.useState(initialFilters.end_date || '');

    const handleFilterChange = () => {
        const query: Record<string, string> = {};
        if (eventFilter && eventFilter !== 'all') query['event_id'] = eventFilter;
        if (senderFilter && senderFilter !== 'all') query['user_id'] = senderFilter;
        if (typeFilter && typeFilter !== 'all') query['type'] = typeFilter;
        if (startDateFilter) query['start_date'] = startDateFilter;
        if (endDateFilter) query['end_date'] = endDateFilter;

        router.get('/email-distributor/mails', query, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setEventFilter('');
        setSenderFilter('');
        setTypeFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        router.get('/email-distributor/mails', {}, { preserveState: true, replace: true });
    };

    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <h2 className="mb-4 text-lg font-semibold">
                Filter Mails{' '}
                <span className="text-sm text-muted-foreground">({totalMails} total)</span>
            </h2>
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex flex-wrap gap-4">
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Filter by event..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            {events.map((event) => (
                                <SelectItem key={event.id} value={String(event.id)}>
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={senderFilter} onValueChange={setSenderFilter}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Filter by sender..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Senders</SelectItem>
                            {senders.map((sender) => (
                                <SelectItem key={sender.id} value={String(sender.id)}>
                                    {sender.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Filter by type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="ticket">Ticket</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-wrap gap-4">
                    <Input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        placeholder="Start date"
                        className="calendar-input-fix w-full md:w-[225px]"
                    />
                    <Input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        placeholder="End date"
                        className="calendar-input-fix w-full md:w-[225px]"
                    />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <Button onClick={handleFilterChange}>Apply Filters</Button>
                <Button variant="ghost" onClick={resetFilters}>Reset</Button>
            </div>
        </div>
    );
}
