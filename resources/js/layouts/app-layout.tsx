import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode; // New prop
}

export default ({ children, breadcrumbs, headerActions, ...props }: AppLayoutProps) => ( // Updated props
    <AppLayoutTemplate breadcrumbs={breadcrumbs} headerActions={headerActions} {...props}> {/* Pass new prop */}
        {children}
    </AppLayoutTemplate>
);