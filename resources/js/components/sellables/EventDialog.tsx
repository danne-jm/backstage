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
import { router, Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import * as React from 'react';

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
}

interface BoardUser {
    id: number;
    name: string;
    email: string;
}

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
                editingEvent.quantity === -1
                    ? ''
                    : editingEvent.quantity?.toString() || '',
            );
            setResponsibleUserId(editingEvent.responsible_user_id.toString());
            setNotes(editingEvent.notes || '');
            setVariableAmount(editingEvent.variable_amount);
            setQuantityWithCard(
                editingEvent.quantity_with_card === -1
                    ? ''
                    : editingEvent.quantity_with_card?.toString() || '',
            );
            setQuantityWithoutCard(
                editingEvent.quantity_without_card === -1
                    ? ''
                    : editingEvent.quantity_without_card?.toString() || '',
            );
            setGoogleSpreadsheetId(editingEvent.google_spreadsheet_id || '');
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
        }
    }, [editingEvent]);

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
                    onOpenChange(false);
                    onSuccess();
                },
            });
        } else {
            router.post('/sellables/events', data, {
                onSuccess: () => {
                    onOpenChange(false);
                    onSuccess();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            onChange={e => setEventName(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="event-description">
                            Description (optional)
                        </Label>
                        <Textarea
                            id="event-description"
                            value={eventDescription}
                            onChange={e => setEventDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="event-date">Event Date</Label>
                        <Input
                            id="event-date"
                            type="date"
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
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
                                onChange={e => setStartSellDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-sell-date">End Sell Date</Label>
                            <Input
                                id="end-sell-date"
                                type="date"
                                value={endSellDate}
                                onChange={e => setEndSellDate(e.target.value)}
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
                                onChange={e => setPriceWithCard(e.target.value)}
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
                                onChange={e =>
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
                                {boardUsers.map(user => (
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
                            onCheckedChange={checked =>
                                setVariableAmount(checked === true)
                            }
                        />
                        <Label
                            htmlFor="variable-amount"
                            className="cursor-pointer"
                        >
                            Variable Amount (separate quantities for with/without
                            card)
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
                                    onChange={e =>
                                        setQuantityWithCard(e.target.value)
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
                                    onChange={e =>
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
                                onChange={e => setQuantity(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    {!editingEvent && (
                        <div className="grid gap-2">
                            <Label>
                                Google Spreadsheet ID (Eventually
                                necessary...)
                            </Label>
                            <Input
                                value={googleSpreadsheetId}
                                onChange={e =>
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
                            <Button
                                asChild
                                variant="secondary"
                                size="sm"
                            >
                                <Link
                                    href={`/sellables/events/${editingEvent.id}/attendees`}
                                >
                                    View & Sync{' '}
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
