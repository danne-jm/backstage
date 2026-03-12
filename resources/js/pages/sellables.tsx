import { Head, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import * as React from 'react';
import { EventDialog } from '@/components/sellables/event-dialog';
import { EventPreview } from '@/components/sellables/event-preview';
import { ProductDialog } from '@/components/sellables/product-dialog';
import { ProductPreview } from '@/components/sellables/product-preview';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSellables } from '@/hooks/use-sellables';
import AppLayout from '@/layouts/app-layout';
import { parseDate } from '@/lib/utils';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { BoardUser, Event, Product } from '@/types/sellables';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sellables',
        href: '/sellables',
    },
];

export default function Sellables() {
    const props = usePage<SharedData>().props;
    const {
        products: productsProp,
        events: eventsProp,
        expired_pagination: expiredPaginationProp,
        boardUsers: boardUsersProp,
    } = props as any;

    const {
        products,
        orderedEvents,
        message,
        setMessage,
        loadingExpired,
        expiredPagination,
        loadMoreExpired,
        deleteProduct,
        deleteEvent,
    } = useSellables(
        Array.isArray(productsProp) ? productsProp : [],
        Array.isArray(eventsProp) ? eventsProp : [],
        expiredPaginationProp,
    );

    const now = new Date();
    const boardUsers: BoardUser[] = Array.isArray(boardUsersProp)
        ? boardUsersProp
        : [];

    // Dialog state
    const [productDialogOpen, setProductDialogOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<Product | null>(
        null,
    );
    const [eventDialogOpen, setEventDialogOpen] = React.useState(false);
    const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);

    const [productToDelete, setProductToDelete] = React.useState<number | null>(
        null,
    );
    const [eventToDelete, setEventToDelete] = React.useState<number | null>(
        null,
    );

    const openProductDialog = (product?: Product) => {
        setEditingProduct(product || null);
        setProductDialogOpen(true);
    };

    const openEventDialog = (event?: Event) => {
        setEditingEvent(event || null);
        setEventDialogOpen(true);
    };

    const canCreateProduct = true;
    const canUpdateProduct = true;
    const canDeleteProduct = true;
    const canCreateEvent = true;
    const canUpdateEvent = true;
    const canDeleteEvent = true;

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
                                              orderedEvents[idx - 1]
                                                  .end_sell_date,
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
