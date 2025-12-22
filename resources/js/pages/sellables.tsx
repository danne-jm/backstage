import { Alert, AlertTitle } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { Check, ExternalLink } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sellables',
        href: '/sellables',
    },
];

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    quantity?: number | null;
    variable_amount?: boolean;
    quantity_with_card?: number | null;
    quantity_without_card?: number | null;
}

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
}

interface BoardUser {
    id: number;
    name: string;
    email: string;
}

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

    // Events: classify into active (start <= now <= end), upcoming (start > now), expired (end < now)
    // Split initial events into live/upcoming and the (first page) expired events.
    const initialActiveEvents: Event[] = [];
    const initialUpcomingEvents: Event[] = [];
    const initialExpiredEvents: Event[] = [];

    (events || []).forEach((ev) => {
        const eventDate = parseDate(ev.event_date);
        const start = parseDate(ev.start_sell_date);
        const end = parseDate(ev.end_sell_date);
        if (!eventDate || !start || !end) {
            // treat malformed dates as expired to avoid showing as sellable
            initialExpiredEvents.push(ev);
            return;
        }

        if (eventDate.getTime() < now.getTime()) {
            initialExpiredEvents.push(ev);
        } else if (
            now.getTime() >= start.getTime() &&
            now.getTime() <= end.getTime()
        ) {
            initialActiveEvents.push(ev);
        } else {
            initialUpcomingEvents.push(ev);
        }
    });

    // Keep expired events in state so we can append additional pages
    const [expiredEventsState, setExpiredEventsState] = React.useState<
        Event[]
    >(() => initialExpiredEvents);

    const [expiredPagination, setExpiredPagination] = React.useState<any>(
        expiredPaginationProp ?? {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: initialExpiredEvents.length,
            has_more: false,
        },
    );

    const [loadingExpired, setLoadingExpired] = React.useState(false);

    // Active: sort by fewest sellable days left (end - now) ascending
    const activeEvents = initialActiveEvents.slice();
    const upcomingEvents = initialUpcomingEvents.slice();

    activeEvents.sort((a: Event, b: Event) => {
        const aEnd = parseDate(a.end_sell_date) as Date;
        const bEnd = parseDate(b.end_sell_date) as Date;
        return (
            aEnd.getTime() - now.getTime() - (bEnd.getTime() - now.getTime())
        );
    });

    // Upcoming: sort by soonest start date
    upcomingEvents.sort(
        (a: Event, b: Event) =>
            (parseDate(a.start_sell_date) as Date).getTime() -
            (parseDate(b.start_sell_date) as Date).getTime(),
    );

    const orderedEvents = [
        ...activeEvents,
        ...upcomingEvents,
        ...expiredEventsState,
    ];

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
    const [productName, setProductName] = React.useState('');
    const [productPrice, setProductPrice] = React.useState('');
    const [productDescription, setProductDescription] = React.useState('');
    const [productQuantity, setProductQuantity] = React.useState('');
    const [productVariableAmount, setProductVariableAmount] = React.useState(false);
    const [productQuantityWithCard, setProductQuantityWithCard] = React.useState('');
    const [productQuantityWithoutCard, setProductQuantityWithoutCard] = React.useState('');

    // Event form state
    const [eventDialogOpen, setEventDialogOpen] = React.useState(false);
    const [editingEvent, setEditingEvent] = React.useState<Event | null>(null);
    const [eventName, setEventName] = React.useState('');
    const [eventDescription, setEventDescription] = React.useState('');
    const [eventDate, setEventDate] = React.useState('');
    const [startSellDate, setStartSellDate] = React.useState('');
    const [endSellDate, setEndSellDate] = React.useState('');
    const [priceWithCard, setPriceWithCard] = React.useState('');
    const [priceWithoutCard, setPriceWithoutCard] = React.useState('');
    const [quantity, setQuantity] = React.useState('');
    const [responsibleUserId, setResponsibleUserId] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [variableAmount, setVariableAmount] = React.useState(false);
    const [quantityWithCard, setQuantityWithCard] = React.useState('');
    const [quantityWithoutCard, setQuantityWithoutCard] = React.useState('');
    const [googleSpreadsheetId, setGoogleSpreadsheetId] = React.useState('');

    const openProductDialog = (product?: Product) => {
        // Open product dialog. Do not manually manage scroll restoration —
        // rely on the dialog component to preserve the user's position.
        if (product) {
            setEditingProduct(product);
            setProductName(product.name);
            setProductPrice(product.price.toString());
            setProductDescription(product.description || '');
            setProductQuantity(product.quantity?.toString() || '');
            setProductVariableAmount(Boolean(product.variable_amount));
            setProductQuantityWithCard(product.quantity_with_card?.toString() || '');
            setProductQuantityWithoutCard(product.quantity_without_card?.toString() || '');
        } else {
            setEditingProduct(null);
            setProductName('');
            setProductPrice('');
            setProductDescription('');
            setProductQuantity('');
            setProductVariableAmount(false);
            setProductQuantityWithCard('');
            setProductQuantityWithoutCard('');
        }
        setProductDialogOpen(true);

        // Some Dialog implementations auto-focus the first input for accessibility.
        // That causes desktop text selection and mobile keyboards to open unexpectedly when the
        // dialog is shown. Immediately blur any input that received focus so the user must
        // tap the field to start editing.
        // We use a short timeout to let the Dialog mount and run its own focus logic first.
        setTimeout(() => {
            const active = document.activeElement as HTMLElement | null;
            if (
                active &&
                (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
            ) {
                try {
                    active.blur();
                } catch (e) {
                        void e;
                }
            }
        }, 50);
    };

    const submitProduct = () => {
        const data: any = {
            name: productName,
            price: parseFloat(productPrice),
            description: productDescription || null,
            variable_amount: productVariableAmount,
            quantity: productVariableAmount ? null : (productQuantity ? parseInt(productQuantity) : null),
            quantity_with_card: productVariableAmount && productQuantityWithCard ? parseInt(productQuantityWithCard) : null,
            quantity_without_card: productVariableAmount && productQuantityWithoutCard ? parseInt(productQuantityWithoutCard) : null,
        };

        if (editingProduct) {
            router.put(`/sellables/products/${editingProduct.id}`, data, {
                onSuccess: () => {
                    setProductDialogOpen(false);
                    setMessage('Product updated successfully');
                },
            });
        } else {
            router.post('/sellables/products', data, {
                onSuccess: () => {
                    setProductDialogOpen(false);
                    setMessage('Product created successfully');
                },
            });
        }
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
        // Open event dialog. Do not manually manage scroll restoration —
        // rely on the dialog component to preserve the user's position.
        if (event) {
            setEditingEvent(event);
            setEventName(event.name);
            setEventDescription(event.description || '');
            setEventDate(event.event_date.split('T')[0]);
            setStartSellDate(event.start_sell_date.split('T')[0]);
            setEndSellDate(event.end_sell_date.split('T')[0]);
            setPriceWithCard(event.price_with_card.toString());
            setPriceWithoutCard(event.price_without_card.toString());
            setQuantity(event.quantity?.toString() || '');
            setResponsibleUserId(event.responsible_user_id.toString());
            setNotes(event.notes || '');
            setVariableAmount(event.variable_amount);
            setQuantityWithCard(event.quantity_with_card?.toString() || '');
            setQuantityWithoutCard(
                event.quantity_without_card?.toString() || '',
            );
            setGoogleSpreadsheetId(event.google_spreadsheet_id || '');
        } else {
            setEditingEvent(null);
            setEventName('');
            setEventDescription('');
            setEventDate('');
            setStartSellDate('');
            setEndSellDate('');
            setPriceWithCard('');
            setPriceWithoutCard('');
            setQuantity('');
            setResponsibleUserId('');
            setNotes('');
            setVariableAmount(false);
            setQuantityWithCard('');
            setQuantityWithoutCard('');
            setGoogleSpreadsheetId('');
        }
        setEventDialogOpen(true);

        // Prevent the dialog from auto-focusing the first input (which triggers text selection
        // on desktop and keyboard on mobile). Blur any focused input shortly after opening.
        setTimeout(() => {
            const active = document.activeElement as HTMLElement | null;
            if (
                active &&
                (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
            ) {
                try {
                    active.blur();
                } catch (e) {
                        void e;
                }
            }
        }, 50);
    };

    const submitEvent = () => {
        const data: any = {
            name: eventName,
            description: eventDescription || null,
            event_date: eventDate,
            start_sell_date: startSellDate,
            end_sell_date: endSellDate,
            price_with_card: parseFloat(priceWithCard),
            price_without_card: parseFloat(priceWithoutCard),
            quantity: variableAmount
                ? null
                : quantity
                  ? parseInt(quantity)
                  : null,
            responsible_user_id: parseInt(responsibleUserId),
            notes: notes || null,
            variable_amount: variableAmount,
            quantity_with_card:
                variableAmount && quantityWithCard
                    ? parseInt(quantityWithCard)
                    : null,
            quantity_without_card:
                variableAmount && quantityWithoutCard
                    ? parseInt(quantityWithoutCard)
                    : null,
            google_spreadsheet_id: googleSpreadsheetId || null,
        };

        if (editingEvent) {
            router.put(`/sellables/events/${editingEvent.id}`, data, {
                onSuccess: () => {
                    setEventDialogOpen(false);
                    setMessage('Event updated successfully');
                },
            });
        } else {
            router.post('/sellables/events', data, {
                onSuccess: () => {
                    setEventDialogOpen(false);
                    setMessage('Event created successfully');
                },
            });
        }
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

                    <Dialog
                        open={productDialogOpen}
                        onOpenChange={setProductDialogOpen}
                    >
                        <DialogContent className="max-h-[90vh] w-full max-w-lg overflow-y-auto px-2 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
                            <DialogTitle>
                                {editingProduct
                                    ? 'Edit Product'
                                    : 'Add Product'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingProduct
                                    ? 'Update the product details below.'
                                    : 'Enter the details for the new product.'}
                            </DialogDescription>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="product-name">Name</Label>
                                    <Input
                                        id="product-name"
                                        value={productName}
                                        onChange={(e) =>
                                            setProductName(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="product-description">
                                        Description (optional)
                                    </Label>
                                    <Textarea
                                        id="product-description"
                                        value={productDescription}
                                        onChange={(e) =>
                                            setProductDescription(
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="product-price">
                                        Price (€)
                                    </Label>
                                    <Input
                                        id="product-price"
                                        type="number"
                                        step="0.01"
                                        value={productPrice}
                                        onChange={(e) =>
                                            setProductPrice(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="product-quantity">
                                        Quantity (optional)
                                    </Label>
                                    <Input
                                        id="product-quantity"
                                        type="number"
                                        value={productQuantity}
                                        onChange={(e) =>
                                            setProductQuantity(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="product-variable-amount"
                                        checked={productVariableAmount}
                                        onCheckedChange={(checked) =>
                                            setProductVariableAmount(checked === true)
                                        }
                                    />
                                    <Label
                                        htmlFor="product-variable-amount"
                                        className="cursor-pointer"
                                    >
                                        Variable Amount (separate quantities for
                                        with/without card)
                                    </Label>
                                </div>
                                {productVariableAmount && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="product-quantity-with-card">
                                                Quantity with Card
                                            </Label>
                                            <Input
                                                id="product-quantity-with-card"
                                                type="number"
                                                value={productQuantityWithCard}
                                                onChange={(e) =>
                                                    setProductQuantityWithCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="product-quantity-without-card">
                                                Quantity without Card
                                            </Label>
                                            <Input
                                                id="product-quantity-without-card"
                                                type="number"
                                                value={productQuantityWithoutCard}
                                                onChange={(e) =>
                                                    setProductQuantityWithoutCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button onClick={submitProduct}>
                                    {editingProduct
                                        ? 'Update Product'
                                        : 'Create Product'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {products.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            No products available
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {products.map((product) => (
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
                                        <div className="mt-1 text-sm text-muted-foreground">
                                            {product.variable_amount ? (
                                                <>
                                                    Qty w/ Card: {product.quantity_with_card ?? 'N/A'} | w/o Card: {product.quantity_without_card ?? 'N/A'}
                                                </>
                                            ) : (
                                                <>
                                                    Quantity: {product.quantity ?? 'Unlimited'}
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
                                                onOpenChange={(open) =>
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

                    <Dialog
                        open={eventDialogOpen}
                        onOpenChange={setEventDialogOpen}
                    >
                        <DialogContent className="max-h-[80vh] w-full max-w-lg overflow-y-auto px-2 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
                            <DialogTitle>
                                {editingEvent ? 'Edit Event' : 'Add Event'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingEvent
                                    ? 'Update the event details below.'
                                    : 'Enter the details for the new event.'}
                            </DialogDescription>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="event-name">Name</Label>
                                    <Input
                                        id="event-name"
                                        value={eventName}
                                        onChange={(e) =>
                                            setEventName(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-description">
                                        Description (optional)
                                    </Label>
                                    <Textarea
                                        id="event-description"
                                        value={eventDescription}
                                        onChange={(e) =>
                                            setEventDescription(e.target.value)
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="event-date">
                                        Event Date
                                    </Label>
                                    <Input
                                        id="event-date"
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) =>
                                            setEventDate(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="start-sell-date">
                                            Start Sell Date
                                        </Label>
                                        <Input
                                            id="start-sell-date"
                                            type="date"
                                            value={startSellDate}
                                            onChange={(e) =>
                                                setStartSellDate(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="end-sell-date">
                                            End Sell Date
                                        </Label>
                                        <Input
                                            id="end-sell-date"
                                            type="date"
                                            value={endSellDate}
                                            onChange={(e) =>
                                                setEndSellDate(e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price-with-card">
                                            Price with ESN Card (€)
                                        </Label>
                                        <Input
                                            id="price-with-card"
                                            type="number"
                                            step="0.01"
                                            value={priceWithCard}
                                            onChange={(e) =>
                                                setPriceWithCard(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="price-without-card">
                                            Price without ESN Card (€)
                                        </Label>
                                        <Input
                                            id="price-without-card"
                                            type="number"
                                            step="0.01"
                                            value={priceWithoutCard}
                                            onChange={(e) =>
                                                setPriceWithoutCard(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="responsible-user">
                                        Responsible User (Board)
                                    </Label>
                                    <Select
                                        value={responsibleUserId}
                                        onValueChange={setResponsibleUserId}
                                    >
                                        <SelectTrigger id="responsible-user">
                                            <SelectValue placeholder="Select a board member" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {boardUsers.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="variable-amount"
                                        checked={variableAmount}
                                        onCheckedChange={(checked) =>
                                            setVariableAmount(checked === true)
                                        }
                                    />
                                    <Label
                                        htmlFor="variable-amount"
                                        className="cursor-pointer"
                                    >
                                        Variable Amount (separate quantities for
                                        with/without card)
                                    </Label>
                                </div>
                                {variableAmount ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="quantity-with-card">
                                                Quantity with Card
                                            </Label>
                                            <Input
                                                id="quantity-with-card"
                                                type="number"
                                                value={quantityWithCard}
                                                onChange={(e) =>
                                                    setQuantityWithCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="quantity-without-card">
                                                Quantity without Card
                                            </Label>
                                            <Input
                                                id="quantity-without-card"
                                                type="number"
                                                value={quantityWithoutCard}
                                                onChange={(e) =>
                                                    setQuantityWithoutCard(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="quantity">
                                            Quantity (optional)
                                        </Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={quantity}
                                            onChange={(e) =>
                                                setQuantity(e.target.value)
                                            }
                                        />
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="notes">
                                        Notes (optional)
                                    </Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) =>
                                            setNotes(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Google Spreadsheet ID (Optional)</Label>
                                    <Input
                                        value={googleSpreadsheetId}
                                        onChange={(e) => setGoogleSpreadsheetId(e.target.value)}
                                        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBkJ..."
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Link a Google Sheet to sync attendees.
                                    </p>
                                </div>
                                {editingEvent && (
                                    <div className="mt-4 rounded-md bg-muted p-4 flex items-center justify-between">
                                        <div className="text-sm font-medium">Manage Attendees</div>
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href={`/ticketing/events/${editingEvent.id}/attendees`}>
                                                View & Sync <ExternalLink className="ml-2 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                </DialogClose>
                                <Button onClick={submitEvent}>
                                    {editingEvent
                                        ? 'Update Event'
                                        : 'Create Event'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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

                                        <div
                                            key={event.id}
                                            className="rounded-lg border p-4"
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
                                                                    Qty with
                                                                    Card:
                                                                </span>{' '}
                                                                {event.quantity_with_card ??
                                                                    'N/A'}{' '}
                                                                |{' '}
                                                                <span className="text-muted-foreground">
                                                                    without
                                                                    Card:
                                                                </span>{' '}
                                                                {event.quantity_without_card ??
                                                                    'N/A'}
                                                            </p>
                                                        ) : (
                                                            <p>
                                                                <span className="text-muted-foreground">
                                                                    Quantity:
                                                                </span>{' '}
                                                                {event.quantity ??
                                                                    'Unlimited'}
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
                                                            onOpenChange={(
                                                                open,
                                                            ) =>
                                                                !open &&
                                                                setEventToDelete(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                                                                <DialogTitle>
                                                                    Delete Event
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Are you sure
                                                                    you want to
                                                                    delete "
                                                                    {event.name}
                                                                    "? This
                                                                    action
                                                                    cannot be
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
                <div className="flex justify-center mt-2">
                    <Button onClick={loadMoreExpired} disabled={loadingExpired}>
                        {loadingExpired ? 'Loading...' : 'Load more expired events'}
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
