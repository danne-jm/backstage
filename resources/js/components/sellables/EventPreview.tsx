import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface Event {
    id: number;
    name: string;
    description: string | null;
    event_date: string;
    start_sell_date: string;
    end_sell_date: string;
    price_with_card: number;
    price_without_card: number;
    quantity: number | null;
    responsible_user_id: number;
    notes: string | null;
    variable_amount: boolean;
    quantity_with_card: number | null;
    quantity_without_card: number | null;
    google_spreadsheet_id: string | null;
    responsibleUser?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    remaining: number;
    remaining_with_card: number;
    remaining_without_card: number;
    is_online_sellable: boolean;
}

interface EventPreviewProps {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete?: (eventId: number) => void;
    eventToDelete?: number | null;
    setEventToDelete?: (id: number | null) => void;
    variant: 'sellables' | 'store-manager';
    isOnline?: boolean;
    onSetOnline?: (eventId: number, isOnline: boolean) => void;
}

export function EventPreview({
    event,
    onEdit,
    onDelete,
    eventToDelete,
    setEventToDelete,
    variant,
    isOnline,
    onSetOnline,
}: EventPreviewProps) {
    const formatDate = (iso: string) => {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const daysRemaining = (iso: string) => {
        const now = new Date();
        const d = new Date(iso);
        if (isNaN(d.getTime())) return 0;
        const msPerDay = 1000 * 60 * 60 * 24;
        const diff = Math.ceil((d.getTime() - now.getTime()) / msPerDay);
        return diff;
    };

    const sellPeriodMessage = (startIso: string, endIso: string) => {
        const now = new Date();
        const start = new Date(startIso);
        const end = new Date(endIso);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

        if (now.getTime() < start.getTime()) {
            const days = daysRemaining(startIso);
            return `Start selling in ${days} ${days === 1 ? 'day' : 'days'}`;
        }

        if (now.getTime() <= end.getTime()) {
            const days = daysRemaining(endIso);
            return `Stop selling in ${days} ${days === 1 ? 'day' : 'days'}`;
        }

        return 'Sale ended';
    };

    return (
        <div className="relative rounded-lg border p-4">
            <div className="flex items-start">
                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <h3 className="font-medium">{event.name}</h3>

                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => onEdit(event)}>
                                Edit
                            </Button>

                            {variant === 'sellables' && onDelete && setEventToDelete && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:bg-muted/30"
                                        onClick={() => setEventToDelete(event.id)}
                                    >
                                        Remove
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {variant === 'sellables' && event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {event.description}
                        </p>
                    )}

                    <div className="mt-2 space-y-1 text-sm">
                        {variant === 'sellables' && (
                            <p>
                                <span className="text-muted-foreground">
                                    Event Date:
                                </span>{' '}
                                {formatDate(event.event_date)}
                            </p>
                        )}
                        <p>
                            <span className="text-muted-foreground">
                                Sell Period:
                            </span>{' '}
                            {formatDate(event.start_sell_date)} -{' '}
                            {formatDate(event.end_sell_date)}
                            {variant === 'sellables' && (
                                <span className="ml-2 text-muted-foreground">
                                    |{' '}
                                    {sellPeriodMessage(
                                        event.start_sell_date,
                                        event.end_sell_date,
                                    )}
                                </span>
                            )}
                        </p>
                        <p>
                            <span className="text-muted-foreground">
                                Price with Card:
                            </span>{' '}
                            €{event.price_with_card} |{' '}
                            <span className="text-muted-foreground">
                                without Card:
                            </span>{' '}
                            €{event.price_without_card}
                        </p>
                        {event.variable_amount ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-muted-foreground">
                                        Qty w/ Card:
                                    </span>{' '}
                                    {event.quantity_with_card === -1
                                        ? 'Unlimited'
                                        : event.quantity_with_card}
                                    {event.quantity_with_card !== -1 &&
                                        event.remaining_with_card !== undefined &&
                                        event.remaining_with_card !== null && (
                                            <span className="text-gray-500">
                                                {' '}
                                                | {event.remaining_with_card} remain
                                            </span>
                                        )}{' '}
                                    |{' '}
                                    <span className="text-muted-foreground">
                                        w/o Card:
                                    </span>{' '}
                                    {event.quantity_without_card === -1
                                        ? 'Unlimited'
                                        : event.quantity_without_card}
                                    {event.quantity_without_card !== -1 &&
                                        event.remaining_without_card !==
                                            undefined &&
                                        event.remaining_without_card !== null && (
                                            <span className="text-gray-500">
                                                {' '}
                                                | {event.remaining_without_card}{' '}
                                                remain
                                            </span>
                                        )}
                                </div>

                                {variant === 'store-manager' && onSetOnline && (
                                    <div className="flex items-center space-x-2 ml-4">
                                        <Checkbox
                                            id={`online-${event.id}`}
                                            checked={isOnline}
                                            onCheckedChange={checked => onSetOnline(event.id, checked === true)}
                                        />
                                        <label
                                            htmlFor={`online-${event.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Sell Online
                                        </label>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-muted-foreground">
                                        Quantity:
                                    </span>{' '}
                                    {event.quantity === -1
                                        ? 'Unlimited'
                                        : event.quantity}
                                    {event.quantity !== -1 &&
                                        event.remaining !== undefined &&
                                        event.remaining !== null && (
                                            <span className="text-gray-500">
                                                {' '}
                                                | {event.remaining} remain
                                            </span>
                                        )}
                                </div>

                                {variant === 'store-manager' && onSetOnline && (
                                    <div className="flex items-center space-x-2 ml-4">
                                        <Checkbox
                                            id={`online-${event.id}`}
                                            checked={isOnline}
                                            onCheckedChange={checked => onSetOnline(event.id, checked === true)}
                                        />
                                        <label
                                            htmlFor={`online-${event.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Sell Online
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}
                        {variant === 'sellables' && (
                            <p>
                                <span className="text-muted-foreground">
                                    Responsible:
                                </span>{' '}
                                {event.responsibleUser
                                    ? `${event.responsibleUser.first_name} ${event.responsibleUser.last_name}`
                                    : 'N/A'}
                            </p>
                        )}
                        {event.notes && (
                            <p>
                                <span className="text-muted-foreground">
                                    Notes:
                                </span>{' '}
                                {event.notes}
                            </p>
                        )}
                    </div>
                </div>

                {/* Delete dialog kept separate from layout */}
                {variant === 'sellables' && onDelete && setEventToDelete && (
                    <Dialog
                        open={eventToDelete === event.id}
                        onOpenChange={open => !open && setEventToDelete(null)}
                    >
                        <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                            <DialogTitle>Delete Event</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{event.name}"? This action cannot be undone.
                            </DialogDescription>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={() => onDelete(event.id)}>
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            {variant === 'sellables' && (
                <div className="absolute bottom-4 right-4">
                    <Button asChild variant="secondary" size="sm">
                        <Link
                            href={`/sellables/events/${event.id}/attendees`}
                        >
                            View & Sync{' '}
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
