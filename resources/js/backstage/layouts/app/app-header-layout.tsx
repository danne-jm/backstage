import { AppContent } from '@backstage/components/app-content';
import { AppHeader } from '@backstage/components/app-header';
import { AppShell } from '@backstage/components/app-shell';
import type { AppLayoutProps } from '@backstage/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
