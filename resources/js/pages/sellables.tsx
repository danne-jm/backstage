import { EventDialog } from '@/components/sellables/event-dialog';
import { EventPreview } from '@/components/sellables/event-preview';
import { ProductDialog } from '@/components/sellables/product-dialog';
import { ProductPreview } from '@/components/sellables/product-preview';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
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

export default function Sellables() {
    const props = usePage<SharedData>().props;

    const { products: productsProp, events: eventsProp } = props as any;

    const [products, setProducts] = React.useState<Product[]>(
        Array.isArray(productsProp) ? productsProp : [],
    );
    const [events, setEvents] = React.useState<Event[]>(
        Array.isArray(eventsProp) ? eventsProp : [],
    );

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
                            const newArr = [...prev];
                            newArr[idx] = { ...newArr[idx], ...s } as Product;
                            return newArr;
                        }
                        return [...prev, s as Product].sort((a, b) =>
                            a.name.localeCompare(b.name),
                        );
                    });
                } else if (s.type === 'event') {
                    setEvents((prev) => {
                        const idx = prev.findIndex((ev) => ev.id === s.id);
                        if (idx >= 0) {
                            const newArr = [...prev];
                            newArr[idx] = { ...newArr[idx], ...s } as Event;
                            return newArr;
                        }
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
    const canCreateProduct = true;
    const canUpdateProduct = true;
    const canDeleteProduct = true;

    const canCreateEvent = true;
    const canUpdateEvent = true;
    const canDeleteEvent = true;

    const boardUsers: BoardUser[] = Array.isArray(props['boardUsers'])
        ? props['boardUsers']
        : [];

    const now = new Date();

    const parseDate = (iso?: string | null) => {
        if (!iso) return null;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    };

    const [expiredEventsState, setExpiredEventsState] = React.useState<Event[]>(
        () => {
            return (events || []).filter((ev) => {
                const d = parseDate(ev.end_sell_date);
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

    const notExpiredEvents = React.useMemo(() => {
        const list = (events || []).filter((ev) => {
            const d = parseDate(ev.end_sell_date);
            return d ? d.getTime() >= Date.now() : false;
        });
        return list.sort((a, b) => {
            const aDate = parseDate(a.event_date);
            const bDate = parseDate(b.event_date);

            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;

            return aDate.getTime() - bDate.getTime();
        });
    }, [events]);

    React.useEffect(() => {
        const nowMs = Date.now();
        const expiredFromProps = (events || []).filter((ev) => {
            const d = parseDate(ev.end_sell_date);
            return !d ? true : d.getTime() < nowMs;
        });

        setExpiredEventsState((prev) => {
            const map = new Map<number, Event>(prev.map((e) => [e.id, e]));
            expiredFromProps.forEach((e) => map.set(e.id, e));
            (events || []).forEach((e) => {
                const d = parseDate(e.end_sell_date);
                if (d && d.getTime() >= nowMs && map.has(e.id)) {
                    map.delete(e.id);
                }
            });
            return Array.from(map.values());
        });
    }, [events]);

    const expiredEvents = React.useMemo(() => {
        return expiredEventsState.slice().sort((a, b) => {
            const aDate = parseDate(a.event_date);
            const bDate = parseDate(b.event_date);

            if (!aDate && !bDate) return 0;
            if (!aDate) return 1;
            if (!bDate) return -1;

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
            console.error(e);
        } finally {
            setLoadingExpired(false);
        }
    }

    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        if (!message) return undefined;
        const t = setTimeout(() => setMessage(''), 4000);
        return () => clearTimeout(t);
    }, [message]);

    const [productDialogOpen, setProductDialogOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(
        null,
    );

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sellables" />

            <div className="flex h-full flex-1 flex-col gap-4 space-y-8 overflow-x-auto rounded-xl p-4">
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
                                const evDate = parseDate(event.end_sell_date);
                                const isPastEvent = evDate
                                    ? evDate.getTime() < now.getTime()
                                    : false;
                                const prevEvDate =
                                    idx > 0
                                        ? parseDate(
                                            orderedEvents[idx - 1].end_sell_date,
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
