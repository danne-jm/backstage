import AppLayoutTemplate from '@backstage/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@backstage/types';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutTemplate>
);
