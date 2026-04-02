import { AppContent } from '@backstage/components/app-content';
import { AppShell } from '@backstage/components/app-shell';
import { AppSidebar } from '@backstage/components/app-sidebar';
import { AppSidebarHeader } from '@backstage/components/app-sidebar-header';
import type { AppLayoutProps } from '@backstage/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} headerActions={headerActions} />
                {children}
            </AppContent>
        </AppShell>
    );
}
