import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { Check, ExternalLink } from 'lucide-react';
import * as React from 'react';
import { ProductDialog } from '@/components/sellables/ProductDialog';
import { EventDialog } from '@/components/sellables/EventDialog';
import type { Product, Event, BoardUser } from '@/types/sellables';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sellables',
        href: '/sellables',
    },
];

// types are imported from resources/js/types/sellables.ts

export default function Sellables() {
    // (no manual scroll save/restore) rely on dialog library's default behaviour
    const props = usePage<SharedData>().props;

    const products: Product[] = Array.isArray(props['products'])
        ? props['products']
        : [];
    const events: Event[] = Array.isArray(props['events'])
        ? props['events']
        : [];
    const expiredPaginationProp: any = props['expired_pagination'] ?? null;
    const boardUsers: BoardUser[] = Array.isArray(props['boardUsers'])
        ? props['boardUsers']
        : [];

    const now = new Date();

    const parseDate = (iso?: string | null) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    // Products: cheapest first (sorted on demand below when used)

    // Events: compute not-expired directly from props.events so it updates
    // whenever props change (e.g. after editing). Keep expired events in
    // state so we can append additional pages; but synchronize state with
    // props to pick up newly expired events or remove ones that became not
    // expired.

    const [expiredEventsState, setExpiredEventsState] = React.useState<
        Event[]
    >(() => {
        // initialize from props.events
        return (events || []).filter(ev => {
            const d = parseDate(ev.event_date);
            return !d ? true : d.getTime() < Date.now();
        });
    });

    const [expiredPagination, setExpiredPagination] = React.useState<any>(
        expiredPaginationProp ?? {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
            has_more: false,
        },
    );

    const [loadingExpired, setLoadingExpired] = React.useState(false);

    // Recompute not-expired events from props so ordering updates when props.events changes
    const notExpiredEvents = React.useMemo(() => {
        const list = (events || []).filter(ev => {
            const d = parseDate(ev.event_date);
            return d ? d.getTime() >= Date.now() : false;
        });
        return list.sort((a, b) => {
            const aDate = parseDate(a.event_date) as Date;
            const bDate = parseDate(b.event_date) as Date;
            return aDate.getTime() - bDate.getTime();
        });
    }, [events]);

    // Keep expiredEventsState synchronized with props.events: add newly expired
    // events from props and remove ones that are now not expired.
    React.useEffect(() => {
        const nowMs = Date.now();
        const expiredFromProps = (events || []).filter(ev => {
            const d = parseDate(ev.event_date);
            return !d ? true : d.getTime() < nowMs;
        });

        setExpiredEventsState(prev => {
            // Map previous expired entries by id for quick lookup/merge
            const map = new Map<number, Event>(prev.map(e => [e.id, e]));

            // Replace/add entries coming from props (these are authoritative)
            expiredFromProps.forEach(e => map.set(e.id, e));

            // Remove entries that appear in props but are not expired anymore
            (events || []).forEach(e => {
                const d = parseDate(e.event_date);
                if (d && d.getTime() >= nowMs && map.has(e.id)) {
                    map.delete(e.id);
                }
            });

            return Array.from(map.values());
        });
    }, [events]);

    // Sort expired events by event_date descending (most recent first)
    const expiredEvents = React.useMemo(() => {
        return expiredEventsState.slice().sort((a, b) => {
            const aDate = parseDate(a.event_date) as Date;
            const bDate = parseDate(b.event_date) as Date;
            return bDate.getTime() - aDate.getTime();
        });
    }, [expiredEventsState]);

    const orderedEvents = [...notExpiredEvents, ...expiredEvents];

    async function loadMoreExpired() {
        if (!expiredPagination?.has_more || loadingExpired) return;
        const nextPage = (expiredPagination.current_page || 1) + 1;
        setLoadingExpired(true);
        try {
            const res = await fetch(
                `/sellables/expired?page=${nextPage}&per_page=${expiredPagination.per_page}`,
                { credentials: 'same-origin' },
            );
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            const newItems: Event[] = Array.isArray(json.data)
                ? json.data
                : [];
            setExpiredEventsState(prev => [...prev, ...newItems]);
            setExpiredPagination(json.pagination ?? { has_more: false });
        } catch (e) {
            // swallow for now or show a message
            console.error(e);
        } finally {
            setLoadingExpired(false);
        }
    }

    // Notification state
    const [message, setMessage] = React.useState('');

    // Auto-dismiss messages
    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    // Product form state
    const [productDialogOpen, setProductDialogOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(
        null,
    );

    // Event form state
    const [eventDialogOpen, setEventDialogOpen] = React.useState(false);
    const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);

    const openProductDialog = (product?: Product) => {
        setEditingProduct(product || null);
        setProductDialogOpen(true);
    };

    const [productToDelete, setProductToDelete] = React.useState<number | null>(
        null,
    );

    const deleteProduct = (productId: number) => {
        router.delete(`/sellables/products/${productId}`, {
            onSuccess: () => {
                setProductToDelete(null);
                setMessage('Product deleted successfully');
            },
        });
    };

    const openEventDialog = (event?: Event) => {
        setEditingEvent(event || null);
        setEventDialogOpen(true);
    };

    const [eventToDelete, setEventToDelete] = React.useState<number | null>(
        null,
    );

    const deleteEvent = (eventId: number) => {
        router.delete(`/sellables/events/${eventId}`, {
            onSuccess: () => {
                setEventToDelete(null);
                setMessage('Event deleted successfully');
            },
        });
    };

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
        // Round up partial days so e.g. 0.1 days => 1 day remaining
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

    // No manual scroll restoration required; the dialog implementation
    // used throughout the app preserves focus/scroll reliably (see Ticketing page).

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sellables" />

            {/* Floating notification (matches /office page) */}

            {/* Match other pages' padding and container style (same as /office) */}
            <div className="flex h-full flex-1 flex-col gap-4 space-y-8 overflow-x-auto rounded-xl p-4">
                {/* Products Section */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Products</h2>
                        <Button onClick={() => openProductDialog()}>
                            Add Product
                        </Button>
                    </div>

                    <ProductDialog
                        open={productDialogOpen}
                        onOpenChange={setProductDialogOpen}
                        editingProduct={editingProduct}
                        onSuccess={() =>
                            setMessage(
                                editingProduct
                                    ? 'Product updated successfully'
                                    : 'Product created successfully',
                            )
                        }
                    />

                    {products.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            No products available
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div>
                                        <h3 className="font-medium">
                                            {product.name}
                                        </h3>
                                        {product.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {product.description}
                                            </p>
                                        )}
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            €{product.price}
                                        </p>
                                        <div className="mt-1 text-sm">
                                            {' '}
                                            {/* Changed to remove inherited muted-foreground */}
                                            {product.variable_amount ? (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        Qty w/ Card:
                                                    </span>{' '}
                                                    {product.quantity_with_card ===
                                                    -1
                                                        ? 'Unlimited'
                                                        : product.quantity_with_card}
                                                    {product.quantity_with_card !==
                                                        -1 &&
                                                        product.remaining_with_card !==
                                                            undefined &&
                                                        product.remaining_with_card !==
                                                            null && (
                                                            <span className="text-gray-500">
                                                                {' '}
                                                                |{' '}
                                                                {
                                                                    product.remaining_with_card
                                                                }{' '}
                                                                remain
                                                            </span>
                                                        )}{' '}
                                                    |{' '}
                                                    <span className="text-muted-foreground">
                                                        w/o Card:
                                                    </span>{' '}
                                                    {product.quantity_without_card ===
                                                    -1
                                                        ? 'Unlimited'
                                                        : product.quantity_without_card}
                                                    {product.quantity_without_card !==
                                                        -1 &&
                                                        product.remaining_without_card !==
                                                            undefined &&
                                                        product.remaining_without_card !==
                                                            null && (
                                                            <span className="text-gray-500">
                                                                {' '}
                                                                |{' '}
                                                                {
                                                                    product.remaining_without_card
                                                                }{' '}
                                                                remain
                                                            </span>
                                                        )}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-muted-foreground">
                                                        Quantity:
                                                    </span>{' '}
                                                    {product.quantity === -1
                                                        ? 'Unlimited'
                                                        : product.quantity}
                                                    {product.quantity !== -1 &&
                                                        product.remaining !==
                                                            undefined &&
                                                        product.remaining !==
                                                            null && (
                                                            <span className="text-gray-500">
                                                                {' '}
                                                                |{' '}
                                                                {
                                                                    product.remaining
                                                                }{' '}
                                                                remain
                                                            </span>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                openProductDialog(product)
                                            }
                                        >
                                            Edit
                                        </Button>
                                        <>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-muted/30"
                                                onClick={() =>
                                                    setProductToDelete(
                                                        product.id,
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>

                                            <Dialog
                                                open={
                                                    productToDelete ===
                                                    product.id
                                                }
                                                onOpenChange={open =>
                                                    !open &&
                                                    setProductToDelete(null)
                                                }
                                            >
                                                <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                                                    <DialogTitle>
                                                        Delete Product
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Are you sure you want to
                                                        delete "{product.name}"?
                                                        This action cannot be
                                                        undone.
                                                    </DialogDescription>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button variant="ghost">
                                                                Cancel
                                                            </Button>
                                                        </DialogClose>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteProduct(
                                                                    product.id,
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Events Section */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Events</h2>
                        <Button onClick={() => openEventDialog()}>
                            Add Event
                        </Button>
                    </div>

                    <EventDialog
                        open={eventDialogOpen}
                        onOpenChange={setEventDialogOpen}
                        editingEvent={editingEvent}
                        boardUsers={boardUsers}
                        onSuccess={() => {
                            setMessage(
                                editingEvent
                                    ? 'Event updated successfully'
                                    : 'Event created successfully',
                            );
                        }}
                    />

                    {orderedEvents.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            No events available
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {orderedEvents.map((event, idx) => {
                                const evDate = parseDate(event.event_date);
                                const isPastEvent = evDate
                                    ? evDate.getTime() < now.getTime()
                                    : false;
                                const prevEvDate =
                                    idx > 0
                                        ? parseDate(
                                              orderedEvents[idx - 1]
                                                  .event_date,
                                          )
                                        : null;
                                const prevIsPast = prevEvDate
                                    ? prevEvDate.getTime() < now.getTime()
                                    : false;

                                return (
                                    <React.Fragment
                                        key={`event-${event.id}-wrapper`}
                                    >
                                        {!prevIsPast && isPastEvent && (
                                            <div className="my-4 py-6">
                                                <div className="w-full border-t-2 border-dashed border-muted-foreground" />
                                            </div>
                                        )}

                                        <div
                                            key={event.id}
                                            className="relative rounded-lg border p-4"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium">
                                                        {event.name}
                                                    </h3>
                                                    {event.description && (
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 space-y-1 text-sm">
                                                        <p>
                                                            <span className="text-muted-foreground">
                                                                Event Date:
                                                            </span>{' '}
                                                            {formatDate(
                                                                event.event_date,
                                                            )}
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">
                                                                Sell Period:
                                                            </span>{' '}
                                                            {formatDate(
                                                                event.start_sell_date,
                                                            )}{' '}
                                                            -{' '}
                                                            {formatDate(
                                                                event.end_sell_date,
                                                            )}
                                                            <span className="ml-2 text-muted-foreground">
                                                                |{' '}
                                                                {sellPeriodMessage(
                                                                    event.start_sell_date,
                                                                    event.end_sell_date,
                                                                )}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">
                                                                Price with Card:
                                                            </span>{' '}
                                                            €
                                                            {
                                                                event.price_with_card
                                                            }{' '}
                                                            |{' '}
                                                            <span className="text-muted-foreground">
                                                                without Card:
                                                            </span>{' '}
                                                            €
                                                            {
                                                                event.price_without_card
                                                            }
                                                        </p>
                                                        {event.variable_amount ? (
                                                            <p>
                                                                <span className="text-muted-foreground">
                                                                    Qty w/ Card:
                                                                </span>{' '}
                                                                {event.quantity_with_card ===
                                                                -1
                                                                    ? 'Unlimited'
                                                                    : event.quantity_with_card}
                                                                {event.quantity_with_card !==
                                                                    -1 &&
                                                                    event.remaining_with_card !==
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
                                                                    w/o Card:
                                                                </span>{' '}
                                                                {event.quantity_without_card ===
                                                                -1
                                                                    ? 'Unlimited'
                                                                    : event.quantity_without_card}
                                                                {event.quantity_without_card !==
                                                                    -1 &&
                                                                    event.remaining_without_card !==
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
                                                            </p>
                                                        ) : (
                                                            <p>
                                                                <span className="text-muted-foreground">
                                                                    Quantity:
                                                                </span>{' '}
                                                                {event.quantity ===
                                                                -1
                                                                    ? 'Unlimited'
                                                                    : event.quantity}
                                                                {event.quantity !==
                                                                    -1 &&
                                                                    event.remaining !==
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
                                                            </p>
                                                        )}
                                                        <p>
                                                            <span className="text-muted-foreground">
                                                                Responsible:
                                                            </span>{' '}
                                                            {event.responsibleUser
                                                                ? `${event.responsibleUser.first_name} ${event.responsibleUser.last_name}`
                                                                : 'N/A'}
                                                        </p>
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

                                                <div className="flex h-full flex-col justify-between">
                                                    {' '}
                                                    {/* take all remaining height */}
                                                    <div className="ml-4 flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                openEventDialog(
                                                                    event,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-muted-foreground hover:bg-muted/30"
                                                                onClick={() =>
                                                                    setEventToDelete(
                                                                        event.id,
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </Button>

                                                            <Dialog
                                                                open={
                                                                    eventToDelete ===
                                                                    event.id
                                                                }
                                                                onOpenChange={
                                                                    open =>
                                                                        !open &&
                                                                        setEventToDelete(
                                                                            null,
                                                                        )
                                                                }
                                                            >
                                                                <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                                                                    <DialogTitle>
                                                                        Delete
                                                                        Event
                                                                    </DialogTitle>
                                                                    <DialogDescription>
                                                                        Are you
                                                                        sure you
                                                                        want to
                                                                        delete "
                                                                        {
                                                                            event.name
                                                                        }
                                                                        "? This
                                                                        action
                                                                        cannot
                                                                        be
                                                                        undone.
                                                                    </DialogDescription>
                                                                    <DialogFooter>
                                                                        <DialogClose
                                                                            asChild
                                                                        >
                                                                            <Button variant="ghost">
                                                                                Cancel
                                                                            </Button>
                                                                        </DialogClose>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() =>
                                                                                deleteEvent(
                                                                                    event.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    </div>
                                                    {/* Manage Attendees button (bottom-right of event card) */}
                                                    <div className="absolute bottom-4 right-4">
                                                        <Button
                                                            asChild
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={`/sellables/events/${event.id}/attendees`}
                                                            >
                                                                View & Sync{' '}
                                                                <ExternalLink className="ml-2 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {expiredPagination?.has_more && (
                <div className="mt-2 flex justify-center">
                    <Button
                        onClick={loadMoreExpired}
                        disabled={loadingExpired}
                    >
                        {loadingExpired
                            ? 'Loading...'
                            : 'Load more expired events'}
                    </Button>
                </div>
            )}

            {message && (
                <div className="fixed left-1/2 top-4 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                    <Alert>
                        <Check />
                        <AlertTitle>{message}</AlertTitle>
                    </Alert>
                </div>
            )}
        </AppLayout>
    );
}