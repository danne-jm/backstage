import { EventDialog } from '@/Components/Backstage/sellables/EventDialog';
import { EventPreview } from '@/Components/Backstage/sellables/EventPreview';
import { ProductDialog } from '@/Components/Backstage/sellables/ProductDialog';
import { ProductPreview } from '@/Components/Backstage/sellables/ProductPreview';
import { Alert, AlertTitle } from '@/Components/Shared/ui/alert';
import { Button } from '@/Components/Shared/ui/button';
import AppLayout from '@/layouts/Backstage/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import type { BoardUser, Event, Product } from '@/types/sellables';
import { Head, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import * as React from 'react';

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

    const { products: productsProp, events: eventsProp } = props as any;

    const [products, setProducts] = React.useState<Product[]>(
        Array.isArray(productsProp) ? productsProp : [],
    );
    const [events, setEvents] = React.useState<Event[]>(
        Array.isArray(eventsProp) ? eventsProp : [],
    );

    // Sync state with props when they change (e.g. navigation)
    React.useEffect(() => {
        if (Array.isArray(productsProp)) {
            setProducts(productsProp);
        }
    }, [productsProp]);

    React.useEffect(() => {
        if (Array.isArray(eventsProp)) {
            setEvents(eventsProp);
        }
    }, [eventsProp]);

    // Listen to Reverb updates
    React.useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private('store-stats');

        channel.listen(
            'SellableUpdated',
            (e: { sellable: Product | Event }) => {
                const s = e.sellable;
                if (s.type === 'product') {
                    setProducts((prev) => {
                        const idx = prev.findIndex((p) => p.id === s.id);
                        if (idx >= 0) {
                            // Update existing
                            const newArr = [...prev];
                            newArr[idx] = s as Product;
                            return newArr;
                        }
                        // Add new
                        return [...prev, s as Product].sort((a, b) =>
                            a.name.localeCompare(b.name),
                        );
                    });
                } else if (s.type === 'event') {
                    setEvents((prev) => {
                        const idx = prev.findIndex((ev) => ev.id === s.id);
                        if (idx >= 0) {
                            // Update existing
                            const newArr = [...prev];
                            newArr[idx] = s as Event;
                            return newArr;
                        }
                        // Add new
                        return [...prev, s as Event].sort((a, b) =>
                            (a.event_date || '').localeCompare(
                                b.event_date || '',
                            ),
                        );
                    });
                }
            },
        );

        return () => {
            window.Echo?.leave('store-stats');
        };
    }, []);

    const expiredPaginationProp: any = props['expired_pagination'] ?? null;
    const { auth } = usePage().props as unknown as { auth: any };
    const permissions = auth?.user?.permissions || [];
    const canCreateProduct =
        permissions.includes('admin') || permissions.includes('create_product');
    const canUpdateProduct =
        permissions.includes('admin') || permissions.includes('update_product');
    const canDeleteProduct =
        permissions.includes('admin') || permissions.includes('delete_product');

    const canCreateEvent =
        permissions.includes('admin') || permissions.includes('create_event');
    const canUpdateEvent =
        permissions.includes('admin') || permissions.includes('update_event');
    const canDeleteEvent =
        permissions.includes('admin') || permissions.includes('delete_event');

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

    const [expiredEventsState, setExpiredEventsState] = React.useState<Event[]>(
        () => {
            // initialize from props.events
            return (events || []).filter((ev) => {
                const d = parseDate(ev.event_date);
                return !d ? true : d.getTime() < Date.now();
            });
        },
    );

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
        const list = (events || []).filter((ev) => {
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
        const expiredFromProps = (events || []).filter((ev) => {
            const d = parseDate(ev.event_date);
            return !d ? true : d.getTime() < nowMs;
        });

        setExpiredEventsState((prev) => {
            // Map previous expired entries by id for quick lookup/merge
            const map = new Map<number, Event>(prev.map((e) => [e.id, e]));

            // Replace/add entries coming from props (these are authoritative)
            expiredFromProps.forEach((e) => map.set(e.id, e));

            // Remove entries that appear in props but are not expired anymore
            (events || []).forEach((e) => {
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
            const newItems: Event[] = Array.isArray(json.data) ? json.data : [];
            setExpiredEventsState((prev) => [...prev, ...newItems]);
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
                        {canCreateProduct && (
                            <Button onClick={() => openProductDialog()}>
                                Add Product
                            </Button>
                        )}
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
                            {products.map((product) => (
                                <ProductPreview
                                    key={product.id}
                                    product={product}
                                    onEdit={
                                        canUpdateProduct
                                            ? openProductDialog
                                            : undefined
                                    }
                                    onDelete={
                                        canDeleteProduct
                                            ? deleteProduct
                                            : undefined
                                    }
                                    productToDelete={productToDelete}
                                    setProductToDelete={setProductToDelete}
                                    variant="sellables"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Events Section */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Events</h2>
                        {canCreateEvent && (
                            <Button onClick={() => openEventDialog()}>
                                Add Event
                            </Button>
                        )}
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
                                            orderedEvents[idx - 1].event_date,
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

                                        <EventPreview
                                            event={event}
                                            onEdit={
                                                canUpdateEvent
                                                    ? openEventDialog
                                                    : undefined
                                            }
                                            onDelete={
                                                canDeleteEvent
                                                    ? deleteEvent
                                                    : undefined
                                            }
                                            eventToDelete={eventToDelete}
                                            setEventToDelete={setEventToDelete}
                                            variant="sellables"
                                        />
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {expiredPagination?.has_more && (
                <div className="mt-2 flex justify-center">
                    <Button onClick={loadMoreExpired} disabled={loadingExpired}>
                        {loadingExpired
                            ? 'Loading...'
                            : 'Load more expired events'}
                    </Button>
                </div>
            )}

            {message && (
                <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                    <Alert>
                        <Check />
                        <AlertTitle>{message}</AlertTitle>
                    </Alert>
                </div>
            )}
        </AppLayout>
    );
}
