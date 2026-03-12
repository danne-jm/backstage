import { Link } from '@inertiajs/react';
import { ExternalLink, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import type { Event } from '@/types/sellables';

interface EventPreviewProps {
    event: Event;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: number) => void;
    eventToDelete?: number | null;
    setEventToDelete?: (id: number | null) => void;
    variant: 'sellables' | 'store-manager';
    isOnline?: boolean;
    onSetOnline?: (
        eventId: number,
        isOnline: boolean,
        type?: 'product' | 'event',
    ) => void;
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

    // Helper to render variant list
    const renderVariantList = () => (
        <div className="mt-1 space-y-0.5">
            {(event.variants || []).map((variant, idx) => {
                const remaining =
                    variant.quantity !== null &&
                    variant.sold_count !== undefined
                        ? variant.quantity - variant.sold_count
                        : null;
                return (
                    <div
                        key={variant.id || idx}
                        className="text-xs text-muted-foreground"
                    >
                        •{' '}
                        {Object.entries(variant.options || {})
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        {' - '}
                        {variant.quantity === null
                            ? 'Unlimited'
                            : `${variant.quantity} total`}
                        {remaining !== null && (
                            <span className="text-gray-500">
                                {' '}
                                | {remaining} remain
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div
            className={cn(
                'relative flex gap-4 rounded-lg border p-4',
                // Add padding bottom for absolute positioned elements on mobile or store-manager
                // Only sellables needs padding now for Manage Attendees button? Or if we kept that.
                // Store manager sell online is inline now.
                variant === 'sellables' && 'pb-14 sm:pb-4',
            )}
        >
            {/* Image Thumbnail - Rendered differently based on variant */}
            {variant === 'sellables' && (
                <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50 sm:block">
                    {event.image ? (
                        <img
                            src={event.image}
                            alt={event.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/50">
                            <ImageIcon className="h-8 w-8" />
                        </div>
                    )}
                </div>
            )}

            <div className="block min-w-0 flex-1">
                {/* Store Manager: Image Floated Left */}
                {variant === 'store-manager' && (
                    <div className="float-left mr-4 mb-1 hidden h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted/50 sm:block">
                        {event.image ? (
                            <img
                                src={event.image}
                                alt={event.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground/50">
                                <ImageIcon className="h-8 w-8" />
                            </div>
                        )}
                    </div>
                )}

                {/* Desktop Store Manager Actions: Floated Right */}
                {variant === 'store-manager' && onEdit && (
                    <div className="float-right mb-2 ml-4 hidden md:block">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(event)}
                            className="h-8 px-2"
                        >
                            Edit
                        </Button>
                    </div>
                )}

                <div
                    className={
                        variant === 'sellables'
                            ? 'flex flex-col gap-4 md:flex-row'
                            : 'block'
                    }
                >
                    {/* Left Column */}
                    <div className="min-w-0 flex-1">
                        <div
                            className={
                                variant === 'sellables'
                                    ? 'flex items-start'
                                    : 'block'
                            }
                        >
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <h3
                                        className={cn(
                                            'font-medium',
                                            variant === 'store-manager' &&
                                                isOnline &&
                                                event.name.length >= 26 &&
                                                'max-w-[150px] truncate md:max-w-none md:overflow-visible md:whitespace-normal',
                                        )}
                                    >
                                        {event.name}
                                    </h3>

                                    {/* Mobile Actions - Show for both variants on mobile */}
                                    <div className="flex items-center gap-1 md:hidden">
                                        {onEdit && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onEdit(event)}
                                                className="h-8 px-2"
                                            >
                                                Edit
                                            </Button>
                                        )}

                                        {variant === 'sellables' &&
                                            onDelete &&
                                            setEventToDelete && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-muted-foreground hover:bg-muted/30"
                                                    onClick={() =>
                                                        setEventToDelete(
                                                            event.id,
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                    </div>
                                </div>

                                {/* Description - Full Width for Store Manager on Desktop */}
                                {event.description && (
                                    <p
                                        className={cn(
                                            'mt-1 text-sm text-muted-foreground',
                                        )}
                                    >
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
                                            Price with ESNcard:
                                        </span>{' '}
                                        €{event.price_with_card} |{' '}
                                        <span className="text-muted-foreground">
                                            without ESNcard:
                                        </span>{' '}
                                        €{event.price_without_card}
                                    </p>
                                    {event.variants_config &&
                                    event.variants_config.length > 0 ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <span className="text-muted-foreground">
                                                    Variants:
                                                </span>{' '}
                                                <span className="text-foreground">
                                                    {(
                                                        event.variants_config ||
                                                        []
                                                    )
                                                        .map((vc) => vc.name)
                                                        .join(', ')}
                                                </span>
                                                {event.variants &&
                                                    event.variants.length >
                                                        0 && (
                                                        <div
                                                            className={cn(
                                                                'mt-1',
                                                                variant ===
                                                                    'sellables'
                                                                    ? 'hidden'
                                                                    : '',
                                                            )}
                                                        >
                                                            {renderVariantList()}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    ) : event.variable_amount ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-muted-foreground">
                                                    Qty w/ ESNcard:
                                                </span>{' '}
                                                {event.unlimited_quantity_with_card ||
                                                event.quantity_with_card == null
                                                    ? 'Unlimited'
                                                    : event.quantity_with_card}
                                                {event.unlimited_quantity_with_card ||
                                                event.quantity_with_card == null
                                                    ? false
                                                    : event.remaining_with_card !==
                                                          undefined &&
                                                      event.remaining_with_card !==
                                                          null && (
                                                          <span className="text-gray-500">
                                                              {' '}
                                                              |{' '}
                                                              {
                                                                  event.remaining_with_card
                                                              }{' '}
                                                              remain
                                                          </span>
                                                      )}{' '}
                                                |{' '}
                                                <span className="text-muted-foreground">
                                                    w/o ESNcard:
                                                </span>{' '}
                                                {event.unlimited_quantity_without_card ||
                                                event.quantity_without_card ==
                                                    null
                                                    ? 'Unlimited'
                                                    : event.quantity_without_card}
                                                {event.unlimited_quantity_without_card ||
                                                event.quantity_without_card ==
                                                    null
                                                    ? false
                                                    : event.remaining_without_card !==
                                                          undefined &&
                                                      event.remaining_without_card !==
                                                          null && (
                                                          <span className="text-gray-500">
                                                              {' '}
                                                              |{' '}
                                                              {
                                                                  event.remaining_without_card
                                                              }{' '}
                                                              remain
                                                          </span>
                                                      )}
                                                {/* Sell Online Checkbox - Inline with Quantity for Store Manager */}
                                                {variant === 'store-manager' &&
                                                    onSetOnline && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Checkbox
                                                                id={`online-${event.id}`}
                                                                checked={
                                                                    !!isOnline
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    onSetOnline(
                                                                        event.id,
                                                                        checked ===
                                                                            true,
                                                                        'event',
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`online-${event.id}`}
                                                                className="cursor-pointer text-xs font-medium text-muted-foreground"
                                                            >
                                                                Sell Online
                                                            </label>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <span className="text-muted-foreground">
                                                    Quantity:
                                                </span>{' '}
                                                {event.unlimited_quantity ||
                                                event.quantity == null
                                                    ? 'Unlimited'
                                                    : event.quantity}
                                                {event.unlimited_quantity ||
                                                event.quantity == null
                                                    ? false
                                                    : event.remaining !==
                                                          undefined &&
                                                      event.remaining !==
                                                          null && (
                                                          <span className="text-gray-500">
                                                              {' '}
                                                              |{' '}
                                                              {
                                                                  event.remaining
                                                              }{' '}
                                                              remain
                                                          </span>
                                                      )}
                                                {/* Sell Online Checkbox - Inline with Quantity for Store Manager */}
                                                {variant === 'store-manager' &&
                                                    onSetOnline && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <Checkbox
                                                                id={`online-${event.id}`}
                                                                checked={
                                                                    !!isOnline
                                                                }
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    onSetOnline(
                                                                        event.id,
                                                                        checked ===
                                                                            true,
                                                                        'event',
                                                                    )
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`online-${event.id}`}
                                                                className="cursor-pointer text-xs font-medium text-muted-foreground"
                                                            >
                                                                Sell Online
                                                            </label>
                                                        </div>
                                                    )}
                                            </div>
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
                        </div>
                    </div>

                    {/* Center Column: Variant List (Sellables only, Desktop only) */}
                    {variant === 'sellables' &&
                        event.variants &&
                        event.variants.length > 0 && (
                            <div className="hidden w-64 flex-shrink-0 border-l pl-4 md:block">
                                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Variants & Stock
                                </h4>
                                {renderVariantList()}
                            </div>
                        )}

                    {/* Right Column: Actions (Desktop) - Sellables Only */}
                    {variant === 'sellables' && (onEdit || onDelete) && (
                        <div className="hidden flex-shrink-0 flex-row items-start gap-2 md:flex">
                            {onEdit && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEdit(event)}
                                    className="h-8 px-2"
                                >
                                    Edit
                                </Button>
                            )}
                            {onDelete && setEventToDelete && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-muted-foreground hover:bg-muted/30"
                                    onClick={() => setEventToDelete(event.id)}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete dialog kept separate from layout */}
            {variant === 'sellables' && onDelete && setEventToDelete && (
                <Dialog
                    open={eventToDelete === event.id}
                    onOpenChange={(open) => !open && setEventToDelete(null)}
                >
                    <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{event.name}"? This
                            action cannot be undone.
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost">Cancel</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() => onDelete(event.id)}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {variant === 'sellables' && (
                <div className="absolute right-4 bottom-4">
                    <Button asChild variant="secondary" size="sm">
                        <Link href={`/sellables/events/${event.id}/attendees`}>
                            Manage Attendees{' '}
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
