import * as React from 'react';
import { Label } from '@backstage/components/ui/label';
import { BaseFormSection } from './base-form-section';

/**
 * Event details display component
 * Shows detailed information about the selected event
 */
interface EventDetailsProps {
    event: any | null;
}

export function EventDetails({ event }: EventDetailsProps) {
    if (!event) {
        return (
            <div className="rounded bg-muted/40 p-3 text-sm text-muted-foreground">
                No event selected
            </div>
        );
    }

    const details: Array<{ label: string; value: string }> = [];

    if (event.name) {
        details.push({ label: 'Name', value: String(event.name) });
    }

    const rawDate = event.start_date || event.event_date;
    if (rawDate) {
        details.push({
            label: 'Event date',
            value: String(rawDate).slice(0, 10),
        });
    }

    if (event.start_sell_date) {
        details.push({
            label: 'Start selling',
            value: String(event.start_sell_date).slice(0, 10),
        });
    }

    if (event.end_sell_date) {
        details.push({
            label: 'End selling',
            value: String(event.end_sell_date).slice(0, 10),
        });
    }

    if (event.price_with_card !== undefined) {
        details.push({
            label: 'Price (with ESN card)',
            value: `€${Number(event.price_with_card).toFixed(2)}`,
        });
    }

    if (event.price_without_card !== undefined) {
        details.push({
            label: 'Price (without ESN card)',
            value: `€${Number(event.price_without_card).toFixed(2)}`,
        });
    }

    if (event.quantity !== undefined && event.quantity !== null) {
        details.push({
            label: 'Quantity',
            value: String(event.quantity),
        });
    }

    if (event.responsibleUser) {
        details.push({
            label: 'Responsible',
            value: `${event.responsibleUser.first_name} ${event.responsibleUser.last_name}`,
        });
    }

    if (event.notes) {
        details.push({
            label: 'Notes',
            value: String(event.notes),
        });
    }

    if (details.length === 0) {
        return null;
    }

    return (
        <div className="rounded bg-muted/40 p-3 text-sm">
            <Label className="mb-1">Event details</Label>
            <ul className="list-disc pl-5 text-sm">
                {details.map((detail) => (
                    <li key={detail.label}>
                        <strong>{detail.label}:</strong> {detail.value}
                    </li>
                ))}
            </ul>
        </div>
    );
}
