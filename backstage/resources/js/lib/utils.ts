import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    const u1 = typeof url1 === 'string' ? url1 : url1.url;
    const u2 = typeof url2 === 'string' ? url2 : url2.url;

    try {
        const path1 = new URL(u1, 'http://localhost').pathname;
        const path2 = new URL(u2, 'http://localhost').pathname;
        return path1 === path2;
    } catch {
        return u1 === u2;
    }
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
