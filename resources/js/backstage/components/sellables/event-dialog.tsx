import { Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import * as React from 'react';
import { ImageManager } from '@backstage/components/sellables/image-manager';
import { SellableDialogBase } from '@backstage/components/sellables/sellable-dialog-base';
import { VariantManager } from '@backstage/components/sellables/variant-manager';
import { Button } from '@backstage/components/ui/button';
import { Checkbox } from '@backstage/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@backstage/components/ui/collapsible';

import { Input } from '@backstage/components/ui/input';
import { Label } from '@backstage/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';
import { Textarea } from '@backstage/components/ui/textarea';

import type {
    BoardUser,
    Event,
    SellableVariant,
    VariantConfigItem,
} from '@backstage/types/sellables';

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingEvent: Event | null;
    boardUsers: BoardUser[];
    onSuccess: () => void;
    preserveState?: boolean;
}

export function EventDialog({
    open,
    onOpenChange,
    editingEvent,
    boardUsers,
    onSuccess,
    preserveState = false,
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
    const [priceMode, setPriceMode] = React.useState<'single' | 'esncard'>(
        'esncard',
    );
    const [singlePrice, setSinglePrice] = React.useState('');
    const [googleSpreadsheetId, setGoogleSpreadsheetId] = React.useState('');

    // Online Store & Images
    const [isOnlineSellable, setIsOnlineSellable] = React.useState(false);
    const [isOnlineSectionOpen, setIsOnlineSectionOpen] = React.useState(false);
    const [isStockSectionOpen, setIsStockSectionOpen] = React.useState(true);
    const [imagesList, setImagesList] = React.useState<
        { id: number | string; url: string }[]
    >([]);
    const [newImages, setNewImages] = React.useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = React.useState<
        (number | string)[]
    >([]);
    const [instagramLink, setInstagramLink] = React.useState('');
    const [variantsConfig, setVariantsConfig] = React.useState<
        VariantConfigItem[]
    >([]);
    const [variants, setVariants] = React.useState<SellableVariant[]>([]);
    const [stockMode, setStockMode] = React.useState<'simple' | 'variants'>(
        'simple',
    );
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setTimeout(() => {
                const firstError = document.querySelector('.error-scroll-marker');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);
        }
    }, [errors]);

    const formatToTwoDecimals = (value: string): string => {
        if (!value) return '';
        const normalized = value.replace(',', '.');
        const numeric = parseFloat(normalized);
        if (Number.isNaN(numeric)) return value;
        return numeric.toFixed(2);
    };

    React.useEffect(() => {
        if (editingEvent) {
            setEventName(editingEvent.name);
            setEventDescription(editingEvent.description || '');
            setEventDate(editingEvent.event_date?.split('T')[0] || '');
            setStartSellDate(editingEvent.start_sell_date?.split('T')[0] || '');
            setEndSellDate(editingEvent.end_sell_date?.split('T')[0] || '');

            const priceWithCardValue =
                editingEvent.price_with_card !== undefined &&
                    editingEvent.price_with_card !== null
                    ? editingEvent.price_with_card.toString()
                    : '';
            const priceWithoutCardValue =
                editingEvent.price_without_card !== undefined &&
                    editingEvent.price_without_card !== null
                    ? editingEvent.price_without_card.toString()
                    : '';

            if (
                priceWithCardValue &&
                priceWithoutCardValue &&
                priceWithCardValue === priceWithoutCardValue
            ) {
                // Treat equal prices as a single-price configuration
                const formatted = formatToTwoDecimals(priceWithCardValue);
                setPriceMode('single');
                setSinglePrice(formatted);
                setPriceWithCard(formatted);
                setPriceWithoutCard(formatted);
            } else {
                setPriceMode('esncard');
                setSinglePrice('');
                setPriceWithCard(priceWithCardValue);
                setPriceWithoutCard(priceWithoutCardValue);
            }
            setQuantity(
                editingEvent.unlimited_quantity
                    ? ''
                    : editingEvent.remaining?.toString() || '',
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
                    : editingEvent.remaining_with_card?.toString() || '',
            );
            setQuantityWithoutCard(
                editingEvent.unlimited_quantity_without_card
                    ? ''
                    : editingEvent.remaining_without_card?.toString() || '',
            );
            setGoogleSpreadsheetId(editingEvent.google_spreadsheet_id || '');
            setIsOnlineSellable(editingEvent.is_online_sellable);
            setImagesList(editingEvent.images_list || []);
            setNewImages([]);
            setImagesToDelete([]);
            setInstagramLink(editingEvent.instagram_link || '');
            setVariantsConfig(editingEvent.variants_config || []);
            setVariants(
                (editingEvent.variants || []).map((v) => ({
                    ...v,
                    // If quantity is limited, calculate remaining
                    quantity:
                        v.quantity !== null
                            ? v.quantity - (v.sold_count || 0)
                            : null,
                })),
            );
            setStockMode(
                (editingEvent.variants_config || []).length > 0
                    ? 'variants'
                    : 'simple',
            );

            // Default Open States
            setIsOnlineSectionOpen(true);

            const isSimpleStock =
                !editingEvent.variants_config ||
                editingEvent.variants_config.length === 0;
            const isMobile = window.matchMedia('(max-width: 640px)').matches;

            if (isMobile || isSimpleStock) {
                setIsStockSectionOpen(true);
            } else {
                setIsStockSectionOpen(false);
            }
        } else {
            setEventName('');
            setEventDescription('');
            setEventDate('');
            setStartSellDate('');
            setEndSellDate('');
            setPriceMode('esncard');
            setSinglePrice('');
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
            setVariantsConfig([]);
            setVariants([]);
            setStockMode('simple');
            setIsOnlineSectionOpen(true);
            setIsStockSectionOpen(true);
        }
    }, [editingEvent, open]);

    const handleAddImages = (files: FileList) => {
        const filesArray = Array.from(files);
        setNewImages((prev) => [...prev, ...filesArray]);
    };

    const allImagesForDisplay = React.useMemo(() => {
        const existing = (imagesList || []).map((img) => ({
            ...img,
            isNew: false,
        }));
        const incoming = (newImages || []).map((file, idx) => ({
            id: -1 * (idx + 1), // temp id
            url: URL.createObjectURL(file),
            isNew: true,
            file, // keep ref
        }));
        return [...existing, ...incoming];
    }, [imagesList, newImages]);

    const handleRemoveImage = (id: number | string) => {
        if (typeof id === 'number' && id < 0) {
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

        // Always send both prices; in single mode, they are identical
        const withCardToSend = formatToTwoDecimals(priceWithCard);
        const withoutCardToSend = formatToTwoDecimals(priceWithoutCard);
        formData.append('price_with_card', withCardToSend);
        formData.append('price_without_card', withoutCardToSend);

        if (stockMode === 'simple' && !variableAmount) {
            if (quantity) {
                formData.append('remaining_quantity', quantity);
            }
            formData.append(
                'unlimited_quantity',
                (!quantity).toString() ? '1' : '0',
            );
        } else {
            formData.append('quantity', ''); // clear if variable
        }

        const unlimited = variableAmount ? false : !quantity;
        formData.append('unlimited_quantity', unlimited ? '1' : '0');

        formData.append('responsible_user_id', responsibleUserId.toString());
        if (notes) formData.append('notes', notes);

        formData.append('variable_amount', variableAmount ? '1' : '0');

        if (stockMode === 'simple' && variableAmount) {
            if (quantityWithCard) {
                formData.append(
                    'remaining_quantity_with_card',
                    quantityWithCard,
                );
            }
            formData.append(
                'unlimited_quantity_with_card',
                !quantityWithCard ? '1' : '0',
            );

            if (quantityWithoutCard) {
                formData.append(
                    'remaining_quantity_without_card',
                    quantityWithoutCard,
                );
            }
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

        // Append Variants or Quantity based on mode
        if (stockMode === 'variants') {
            formData.append('quantity', '');
            formData.append('unlimited_quantity', '0');
            formData.append('variable_amount', '0');
            formData.append('quantity_with_card', '');
            formData.append('unlimited_quantity_with_card', '0');
            formData.append('quantity_without_card', '');
            formData.append('unlimited_quantity_without_card', '0');

            (variantsConfig || []).forEach((config, idx) => {
                formData.append(`variants_config[${idx}][name]`, config.name);
                (config.options || []).forEach((opt, optIdx) => {
                    formData.append(
                        `variants_config[${idx}][options][${optIdx}]`,
                        opt,
                    );
                });
            });

            (variants || []).forEach((variant, idx) => {
                Object.entries(variant.options || {}).forEach(
                    ([key, value]) => {
                        formData.append(
                            `variants_stock[${idx}][options][${key}]`,
                            value,
                        );
                    },
                );
                if (variant.quantity !== null) {
                    formData.append(
                        `variants_stock[${idx}][remaining_quantity]`,
                        variant.quantity.toString(),
                    );
                } else {
                    formData.append(
                        `variants_stock[${idx}][remaining_quantity]`,
                        '',
                    );
                }
            });
        } else {
            formData.append('variants_config', '');
        }

        if (editingEvent) {
            formData.append('_method', 'PUT');
            router.post(`/sellables/events/${editingEvent.id}`, formData, {
                onSuccess: () => {
                    setErrors({});
                    onOpenChange(false);
                    onSuccess();
                },
                onError: (err) => {
                    setErrors(err);
                },
                forceFormData: true,
                preserveState: 'errors',
                preserveScroll: true,
            });
        } else {
            router.post('/sellables/events', formData, {
                onSuccess: () => {
                    setErrors({});
                    onOpenChange(false);
                    onSuccess();
                },
                onError: (err) => {
                    setErrors(err);
                },
                forceFormData: true,
                preserveState: 'errors',
                preserveScroll: true,
            });
        }
    };

    return (
        <SellableDialogBase
            open={open}
            onOpenChange={onOpenChange}
            title={editingEvent ? 'Edit Event' : 'Add Event'}
            description={
                editingEvent
                    ? 'Update the event details below.'
                    : 'Enter the details for the new event.'
            }
            onSubmit={submitEvent}
            submitLabel={editingEvent ? 'Update Event' : 'Create Event'}
            footerExtra={
                editingEvent ? (
                    <div className="mr-4 flex-1 text-left text-sm text-muted-foreground">
                        Editing: {editingEvent.name}
                    </div>
                ) : undefined
            }
        >
            <div className="flex flex-col gap-6">
                {/* Section 1: Identity & Scheduling */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="event-name">Name</Label>
                        <Input
                            id="event-name"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            className="mt-1"
                        />
                        {errors.name && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.name}</p>}
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
                            className="min-h-[100px]"
                        />
                        {errors.description && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.description}</p>}
                    </div>
                    <div className="min-w-0">
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input
                            id="event-date"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="mt-1 block w-full"
                        />
                        {errors.event_date && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.event_date}</p>}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="min-w-0">
                            <Label
                                htmlFor="start-sell-date"
                                className="text-sm"
                            >
                                Start Sell
                            </Label>
                            <Input
                                id="start-sell-date"
                                type="date"
                                value={startSellDate}
                                onChange={(e) =>
                                    setStartSellDate(e.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                            {errors.start_sell_date && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.start_sell_date}</p>}
                        </div>
                        <div className="min-w-0">
                            <Label htmlFor="end-sell-date" className="text-sm">
                                End Sell
                            </Label>
                            <Input
                                id="end-sell-date"
                                type="date"
                                value={endSellDate}
                                onChange={(e) => setEndSellDate(e.target.value)}
                                className="mt-1 block w-full"
                            />
                            {errors.end_sell_date && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.end_sell_date}</p>}
                        </div>
                    </div>
                    {/* Pricing Section: separate container, similar style to Stock Management */}
                    <div className="rounded-lg border bg-muted/5 px-4 py-3 space-y-4">
                        <div className="mb-0 flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-semibold text-muted-foreground">
                                Pricing
                            </span>
                            <div
                                role="tablist"
                                aria-orientation="horizontal"
                                className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={priceMode === 'single'}
                                    onClick={() =>
                                        setPriceMode('single')
                                    }
                                    className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${priceMode === 'single' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    Single Price
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={priceMode === 'esncard'}
                                    onClick={() =>
                                        setPriceMode('esncard')
                                    }
                                    className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${priceMode === 'esncard' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                >
                                    ESNcard Pricing
                                </button>
                            </div>
                        </div>

                        {priceMode === 'single' && (
                            <div>
                                <Label htmlFor="single-price">Price (€)</Label>
                                <Input
                                    id="single-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={singlePrice}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSinglePrice(value);
                                        setPriceWithCard(value);
                                        setPriceWithoutCard(value);
                                    }}
                                    onBlur={() =>
                                        setSinglePrice((prev) => {
                                            const formatted =
                                                formatToTwoDecimals(prev);
                                            setPriceWithCard(formatted);
                                            setPriceWithoutCard(formatted);
                                            return formatted;
                                        })
                                    }
                                    className="mt-1"
                                />
                                {(errors.price_with_card ||
                                    errors.price_without_card) && (
                                        <p className="mt-1 text-xs text-destructive error-scroll-marker">
                                            {errors.price_with_card ||
                                                errors.price_without_card}
                                        </p>
                                    )}
                            </div>
                        )}

                        {priceMode === 'esncard' && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="price-with-card">
                                        Price w/ ESNcard (€)
                                    </Label>
                                    <Input
                                        id="price-with-card"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={priceWithCard}
                                        onChange={(e) =>
                                            setPriceWithCard(
                                                e.target.value,
                                            )
                                        }
                                        onBlur={() =>
                                            setPriceWithCard((prev) =>
                                                formatToTwoDecimals(prev),
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    {errors.price_with_card && (
                                        <p className="mt-1 text-xs text-destructive error-scroll-marker">
                                            {errors.price_with_card}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="price-without-card">
                                        Price w/o ESNcard (€)
                                    </Label>
                                    <Input
                                        id="price-without-card"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={priceWithoutCard}
                                        onChange={(e) =>
                                            setPriceWithoutCard(
                                                e.target.value,
                                            )
                                        }
                                        onBlur={() =>
                                            setPriceWithoutCard((prev) =>
                                                formatToTwoDecimals(prev),
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    {errors.price_without_card && (
                                        <p className="mt-1 text-xs text-destructive error-scroll-marker">
                                            {errors.price_without_card}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="responsible-user">
                            Responsible User
                        </Label>
                        <Select
                            value={responsibleUserId}
                            onValueChange={setResponsibleUserId}
                        >
                            <SelectTrigger
                                id="responsible-user"
                                className="mt-1"
                            >
                                <SelectValue placeholder="Select board member" />
                            </SelectTrigger>
                            <SelectContent>
                                {boardUsers.map((user) => (
                                    <SelectItem
                                        key={user.id}
                                        value={user.id.toString()}
                                    >
                                        <span className="block max-w-[200px] truncate sm:max-w-full">
                                            {user.name} ({user.email})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.responsible_user_id && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.responsible_user_id}</p>}
                    </div>
                    <div>
                        <Label htmlFor="notes" className="text-sm">
                            Notes (optional)
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 h-[80px]"
                        />
                    </div>
                    {!editingEvent && (
                        <div>
                            <Label className="text-sm">Spreadsheet ID</Label>
                            <Input
                                value={googleSpreadsheetId}
                                onChange={(e) =>
                                    setGoogleSpreadsheetId(e.target.value)
                                }
                                placeholder="Google Sheet ID"
                                className="mt-1"
                            />
                            {errors.google_spreadsheet_id && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.google_spreadsheet_id}</p>}
                        </div>
                    )}
                </div>

                {/* Section 2: Sidebar Options */}
                <div className="space-y-4">
                    {/* Stock Management Collapsible */}
                    <Collapsible
                        open={isStockSectionOpen}
                        onOpenChange={setIsStockSectionOpen}
                        className="rounded-lg border bg-muted/5 px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold">
                                Stock Management
                            </Label>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    {isStockSectionOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="mt-4 space-y-4">
                            <div className="mb-3 flex items-center justify-between border-b pb-3">
                                <span className="text-sm text-muted-foreground">
                                    Type
                                </span>
                                <div
                                    role="tablist"
                                    aria-orientation="horizontal"
                                    className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={stockMode === 'simple'}
                                        onClick={() => setStockMode('simple')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'simple' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={stockMode === 'variants'}
                                        onClick={() => setStockMode('variants')}
                                        className={`inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-all ${stockMode === 'variants' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}
                                    >
                                        Variants
                                    </button>
                                </div>
                            </div>

                            {stockMode === 'simple' && (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="variable-amount"
                                            checked={!!variableAmount}
                                            onCheckedChange={(checked) =>
                                                setVariableAmount(
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Label
                                            htmlFor="variable-amount"
                                            className="cursor-pointer text-sm"
                                        >
                                            Split by ESNcard
                                        </Label>
                                    </div>
                                    {variableAmount ? (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <Label
                                                    htmlFor="quantity-with-card"
                                                    className="text-sm"
                                                >
                                                    {editingEvent ? 'Remaining With Card' : 'Initial With Card'}
                                                </Label>
                                                <Input
                                                    id="quantity-with-card"
                                                    type="number"
                                                    min="0"
                                                    value={quantityWithCard}
                                                    onChange={(e) =>
                                                        setQuantityWithCard(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                {errors.remaining_quantity_with_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_with_card}</p>}
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="quantity-without-card"
                                                    className="text-sm"
                                                >
                                                    {editingEvent ? 'Remaining Without Card' : 'Initial Without Card'}
                                                </Label>
                                                <Input
                                                    id="quantity-without-card"
                                                    type="number"
                                                    min="0"
                                                    value={quantityWithoutCard}
                                                    onChange={(e) =>
                                                        setQuantityWithoutCard(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1"
                                                />
                                                {errors.remaining_quantity_without_card && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity_without_card}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label
                                                htmlFor="quantity"
                                                className="text-sm"
                                            >
                                                {editingEvent ? 'Remaining Quantity' : 'Initial Quantity'}
                                            </Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                min="0"
                                                value={quantity}
                                                onChange={(e) =>
                                                    setQuantity(e.target.value)
                                                }
                                                className="mt-1"
                                                placeholder="Leave empty for unlimited"
                                            />
                                            {errors.remaining_quantity && <p className="mt-1 text-xs text-destructive error-scroll-marker">{errors.remaining_quantity}</p>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {stockMode === 'variants' && (
                                <div className="pt-2">
                                    <VariantManager
                                        initialConfig={variantsConfig}
                                        initialVariants={variants}
                                        onChange={(newConfig, newVariants) => {
                                            setVariantsConfig(newConfig);
                                            setVariants(newVariants);
                                        }}
                                    />
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Online Store Collapsible */}
                    <Collapsible
                        open={isOnlineSectionOpen}
                        onOpenChange={setIsOnlineSectionOpen}
                        className="rounded-lg border px-4 py-3"
                    >
                        <div className="flex items-center justify-between">
                            <Label className="block text-base font-bold">
                                Online Store
                            </Label>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                >
                                    {isOnlineSectionOpen ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="mt-4 space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="online-sellable"
                                    checked={!!isOnlineSellable}
                                    onCheckedChange={(checked) =>
                                        setIsOnlineSellable(checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="online-sellable"
                                    className="cursor-pointer font-medium"
                                >
                                    Sellable Online
                                </Label>
                            </div>

                            <div>
                                <Label className="mb-2 block text-sm font-medium">
                                    Event Images
                                </Label>
                                <ImageManager
                                    images={allImagesForDisplay}
                                    onRemoveImage={handleRemoveImage}
                                    onAddImages={handleAddImages}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    First image = cover
                                </p>
                            </div>

                            <div>
                                <Label
                                    htmlFor="instagram-link"
                                    className="text-sm"
                                >
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
                                    className="mt-1"
                                />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </div>

            {editingEvent && (
                <div className="flex flex-col items-start gap-4 rounded-md bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium">
                        Manage Event Attendees & Sync
                    </div>
                    <Button asChild variant="secondary" size="sm">
                        <Link
                            href={`/sellables/events/${editingEvent.id}/attendees`}
                        >
                            Open Attendees List{' '}
                            <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                    </Button>
                </div>
            )}
        </SellableDialogBase>
    );
}
