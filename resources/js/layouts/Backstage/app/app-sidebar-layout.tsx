import { AppContent } from '@/Components/Backstage/app-content';
import { AppShell } from '@/Components/Backstage/app-shell';
import { AppSidebar } from '@/Components/Backstage/app-sidebar';
import { AppSidebarHeader } from '@/Components/Backstage/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren, type ReactNode } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions, // New prop
}: PropsWithChildren<{
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader
                    breadcrumbs={breadcrumbs}
                    headerActions={headerActions}
                />{' '}
                {/* Pass new prop */}
                {children}
            </AppContent>
        </AppShell>
    );
}
