import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    onlineUsers?: { id: number; name: string; initials: string }[];
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string | null;
    permissions?: string[] | string | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    // Gmail/Google connection fields
    gmail_provider_id?: string | null;
    gmail_provider_email?: string | null;
    gmail_connected?: boolean;
    [key: string]: unknown; // This allows for additional properties...
}
