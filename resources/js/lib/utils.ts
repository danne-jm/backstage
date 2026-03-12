import type {InertiaLinkProps} from '@inertiajs/react';
import { clsx  } from 'clsx';
import type {ClassValue} from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export const parseDate = (iso?: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
};

export const formatDate = (
    iso?: string | null,
    options?: Intl.DateTimeFormatOptions,
) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(
        undefined,
        options || {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        },
    );
};
