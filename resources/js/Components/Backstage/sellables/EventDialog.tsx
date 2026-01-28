import { ImageManager } from '@/Components/Backstage/sellables/ImageManager';
import { Button } from '@/Components/Shared/ui/button';
import { Checkbox } from '@/Components/Shared/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/Components/Shared/ui/dialog';
import { Input } from '@/Components/Shared/ui/input';
import { Label } from '@/Components/Shared/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/Shared/ui/select';
import { Textarea } from '@/Components/Shared/ui/textarea';
import { Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import * as React from 'react';

import type { BoardUser, Event } from '@/types/sellables';

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingEvent: Event | null;
    boardUsers: BoardUser[];
    onSuccess: () => void;
}

export function EventDialog({
    open,
    onOpenChange,
    editingEvent,
    boardUsers,
    onSuccess,
}: EventDialogProps) {
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

    // Online Store & Images
    const [isOnlineSellable, setIsOnlineSellable] = React.useState(false);
    const [isOnlineSectionOpen, setIsOnlineSectionOpen] = React.useState(false);
    const [imagesList, setImagesList] = React.useState<
        { id: number | string; url: string }[]
    >([]);
    const [newImages, setNewImages] = React.useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = React.useState<
        (number | string)[]
    >([]);
    const [instagramLink, setInstagramLink] = React.useState('');

    React.useEffect(() => {
        if (editingEvent) {
            setEventName(editingEvent.name);
            setEventDescription(editingEvent.description || '');
            setEventDate(editingEvent.event_date.split('T')[0]);
            setStartSellDate(editingEvent.start_sell_date.split('T')[0]);
            setEndSellDate(editingEvent.end_sell_date.split('T')[0]);
            setPriceWithCard(editingEvent.price_with_card.toString());
            setPriceWithoutCard(editingEvent.price_without_card.toString());
            setQuantity(
                editingEvent.unlimited_quantity
                    ? ''
                    : editingEvent.quantity?.toString() || '',
            );
            setResponsibleUserId(
                editingEvent.responsible_user_id
                    ? editingEvent.responsible_user_id.toString()
                    : '',
            );
            setNotes(editingEvent.notes || '');
            setVariableAmount(editingEvent.variable_amount);
            setQuantityWithCard(
                editingEvent.unlimited_quantity_with_card
                    ? ''
                    : editingEvent.quantity_with_card?.toString() || '',
            );
            setQuantityWithoutCard(
                editingEvent.unlimited_quantity_without_card
                    ? ''
                    : editingEvent.quantity_without_card?.toString() || '',
            );
            setGoogleSpreadsheetId(editingEvent.google_spreadsheet_id || '');
            setIsOnlineSellable(editingEvent.is_online_sellable);
            setImagesList(editingEvent.images_list || []);
            setNewImages([]);
            setImagesToDelete([]);
            setInstagramLink(editingEvent.instagram_link || '');
            setIsOnlineSectionOpen(false);
        } else {
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
            setIsOnlineSellable(false);
            setImagesList([]);
            setNewImages([]);
            setImagesToDelete([]);
            setInstagramLink('');
            setIsOnlineSectionOpen(false);
        }
    }, [editingEvent, open]);

    const handleAddImages = (files: FileList) => {
        const filesArray = Array.from(files);
        setNewImages((prev) => [...prev, ...filesArray]);
    };

    // Correct approach for mixed images:
    // We will maintain `imagesList` which are server images.
    // And `newImages` which are files.
    // Ideally `ImageManager` should handle both or we merge them for display.

    // Let's refine ImageManager usage inline or wrap it here.
    const allImagesForDisplay = React.useMemo(() => {
        const existing = imagesList.map((img) => ({ ...img, isNew: false }));
        const incoming = newImages.map((file, idx) => ({
            id: -1 * (idx + 1), // temp id
            url: URL.createObjectURL(file),
            isNew: true,
            file, // keep ref
        }));
        return [...existing, ...incoming];
    }, [imagesList, newImages]);

    const handleRemoveImage = (id: number | string) => {
        // Local images have negative number IDs. Server images have ULID matching strings or potentially positive numbers (legacy).
        // Check if it is a local image (negative number).
        if (typeof id === 'number' && id < 0) {
            // Local image
            const indexToRemove = id * -1 - 1;
            setNewImages((prev) =>
                prev.filter((_, idx) => idx !== indexToRemove),
            );
        } else {
            // Server image
            setImagesToDelete((prev) => [...prev, id]);
            setImagesList((prev) => prev.filter((img) => img.id !== id));
        }
    };

    const submitEvent = () => {
        const formData = new FormData();
        formData.append('name', eventName);
        if (eventDescription) formData.append('description', eventDescription);
        formData.append('event_date', eventDate);
        formData.append('start_sell_date', startSellDate);
        formData.append('end_sell_date', endSellDate);
        formData.append('price_with_card', priceWithCard.toString());
        formData.append('price_without_card', priceWithoutCard.toString());

        if (!variableAmount) {
            if (quantity) formData.append('quantity', quantity.toString());
            formData.append(
                'unlimited_quantity',
                (!quantity).toString() ? '1' : '0',
            );
            // booleans in FormData are strings 'true'/'false' or '1'/'0'. Laravel validation 'boolean' supports '1', 'true', 'on', 'yes'.
            // Actually, we should send '1' or '0'.
        } else {
            formData.append('quantity', ''); // clear if variable
        }

        // Fix boolean handling for checkbox:
        // 'unlimited_quantity' is derived. logic: variableAmount ? false : !quantity
        const unlimited = variableAmount ? false : !quantity;
        formData.append('unlimited_quantity', unlimited ? '1' : '0');

        formData.append('responsible_user_id', responsibleUserId.toString());
        if (notes) formData.append('notes', notes);

        formData.append('variable_amount', variableAmount ? '1' : '0');

        if (variableAmount) {
            if (quantityWithCard)
                formData.append('quantity_with_card', quantityWithCard);
            formData.append(
                'unlimited_quantity_with_card',
                !quantityWithCard ? '1' : '0',
            );

            if (quantityWithoutCard)
                formData.append('quantity_without_card', quantityWithoutCard);
            formData.append(
                'unlimited_quantity_without_card',
                !quantityWithoutCard ? '1' : '0',
            );
        }

        if (googleSpreadsheetId)
            formData.append('google_spreadsheet_id', googleSpreadsheetId);
        formData.append('is_online_sellable', isOnlineSellable ? '1' : '0');
        if (instagramLink) formData.append('instagram_link', instagramLink);

        // Append images
        newImages.forEach((file) => {
            formData.append('images[]', file);
        });

        // Append deleted images
        imagesToDelete.forEach((id) => {
            formData.append('deleted_images[]', id.toString());
        });

        if (editingEvent) {
            // PUT with FormData requires _method='PUT' in Laravel usually
            formData.append('_method', 'PUT');
            router.post(`/sellables/events/${editingEvent.id}`, formData, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
                forceFormData: true,
            });
        } else {
            router.post('/sellables/events', formData, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
                forceFormData: true,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
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
                            onChange={(e) => setEventName(e.target.value)}
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
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input
                            id="event-date"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <Label htmlFor="end-sell-date">End Sell Date</Label>
                            <Input
                                id="end-sell-date"
                                type="date"
                                value={endSellDate}
                                onChange={(e) => setEndSellDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="price-with-card">
                                Price with ESNcard (€)
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
                                Price without ESNcard (€)
                            </Label>
                            <Input
                                id="price-without-card"
                                type="number"
                                step="0.01"
                                value={priceWithoutCard}
                                onChange={(e) =>
                                    setPriceWithoutCard(e.target.value)
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
                            with/without ESNcard)
                        </Label>
                    </div>
                    {variableAmount ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="quantity-with-card">
                                    Quantity with ESNcard
                                </Label>
                                <Input
                                    id="quantity-with-card"
                                    type="number"
                                    value={quantityWithCard}
                                    onChange={(e) =>
                                        setQuantityWithCard(e.target.value)
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="quantity-without-card">
                                    Quantity without ESNcard
                                </Label>
                                <Input
                                    id="quantity-without-card"
                                    type="number"
                                    value={quantityWithoutCard}
                                    onChange={(e) =>
                                        setQuantityWithoutCard(e.target.value)
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
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Collapsible Online Store Section */}
                    <div className="rounded-md border">
                        <button
                            type="button"
                            className="flex w-full items-center justify-between bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                            onClick={() =>
                                setIsOnlineSectionOpen(!isOnlineSectionOpen)
                            }
                        >
                            <div className="text-sm font-semibold">
                                Online Store Options
                            </div>
                            {isOnlineSectionOpen ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {isOnlineSectionOpen && (
                            <div className="space-y-4 border-t p-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="online-sellable"
                                        checked={isOnlineSellable}
                                        onCheckedChange={(checked) =>
                                            setIsOnlineSellable(
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor="online-sellable"
                                        className="cursor-pointer"
                                    >
                                        Sellable Online
                                    </Label>
                                </div>

                                <div>
                                    <Label className="mb-2 block">
                                        Event Images
                                    </Label>
                                    <ImageManager
                                        images={allImagesForDisplay}
                                        onRemoveImage={handleRemoveImage}
                                        onAddImages={handleAddImages}
                                    />
                                    <p className="mt-2 text-[0.8rem] text-muted-foreground">
                                        First image will be the cover. Accepted
                                        formats: JPG, PNG.
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="instagram-link">
                                        Instagram Link (optional)
                                    </Label>
                                    <Input
                                        id="instagram-link"
                                        type="url"
                                        value={instagramLink}
                                        onChange={(e) =>
                                            setInstagramLink(e.target.value)
                                        }
                                        placeholder="https://instagram.com/..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {!editingEvent && (
                        <div className="grid gap-2">
                            <Label>
                                Google Spreadsheet ID (Eventually necessary...)
                            </Label>
                            <Input
                                value={googleSpreadsheetId}
                                onChange={(e) =>
                                    setGoogleSpreadsheetId(e.target.value)
                                }
                                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBkJ..."
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                Link a Google Sheet to sync attendees.
                            </p>
                        </div>
                    )}
                    {editingEvent && (
                        <div className="mt-4 flex items-center justify-between rounded-md bg-muted p-4">
                            <div className="text-sm font-medium">
                                Manage Attendees
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link
                                    href={`/sellables/events/${editingEvent.id}/attendees`}
                                >
                                    <ExternalLink className="ml-2 h-3 w-3" />
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
                        {editingEvent ? 'Update Event' : 'Create Event'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
