import { AppContent } from '@/Components/Backstage/app-content';
import { AppShell } from '@/Components/Backstage/app-shell';
import { AppSidebar } from '@/Components/Backstage/app-sidebar';
import { AppSidebarHeader } from '@/Components/Backstage/app-sidebar-header';
import { BottomNav } from '@/Components/Backstage/bottom-nav';
import { useIsPWA } from '@/hooks/use-is-pwa';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Building2,
    LayoutGrid,
    ScanText,
    ShoppingBag,
    Store,
    Ticket,
    Warehouse,
} from 'lucide-react';
import { type PropsWithChildren, type ReactNode, useEffect, useState } from 'react';
import { route } from 'ziggy-js';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    headerActions,
}: PropsWithChildren<{
    breadcrumbs?: BreadcrumbItem[];
    headerActions?: ReactNode;
}>) {
    const isPWA = useIsPWA();
    const { auth } = usePage<SharedData>().props;
    const [isMobile, setIsMobile] = useState(false);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Show bottom nav only on mobile PWA
    const showBottomNav = isPWA && isMobile;

    // Hide scrollbar in PWA mode
    useEffect(() => {
        if (showBottomNav) {
            document.documentElement.style.setProperty('scrollbar-width', 'none');
            document.documentElement.style.setProperty('-ms-overflow-style', 'none');
            document.documentElement.classList.add('pwa-mode');
        } else {
            document.documentElement.style.removeProperty('scrollbar-width');
            document.documentElement.style.removeProperty('-ms-overflow-style');
            document.documentElement.classList.remove('pwa-mode');
        }
        
        return () => {
            document.documentElement.style.removeProperty('scrollbar-width');
            document.documentElement.style.removeProperty('-ms-overflow-style');
            document.documentElement.classList.remove('pwa-mode');
        };
    }, [showBottomNav]);

    // Main nav items for bottom nav (same as sidebar)
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutGrid,
        },
        {
            title: 'Office Shifts',
            href: route('office'),
            icon: Building2,
        },
        {
            title: 'Sellables',
            href: route('sellables'),
            icon: ShoppingBag,
        },
        {
            title: 'Ticket Scanner',
            href: route('ticket-scanner'),
            icon: ScanText,
        },
        {
            title: 'Ticket Distributor',
            href: route('ticketing'),
            icon: Ticket,
        },
        {
            title: 'Inventory',
            href: route('warehouse'),
            icon: Warehouse,
        },
        {
            title: 'Store Manager',
            href: route('store-manager'),
            icon: Store,
        },
    ];

    // Filter nav items based on permissions
    const filteredNavItems = mainNavItems.filter((item) => {
        const permissions = auth?.user?.permissions || [];
        const permissionMap: Record<string, string> = {
            Dashboard: 'view_dashboard',
            'Office Shifts': 'view_office',
            Sellables: 'view_sellables',
            'Ticket Scanner': 'view_ticket_scanner',
            'Ticket Distributor': 'view_ticket_distributor',
            Inventory: 'view_inventory',
            'Store Manager': 'view_store_manager',
        };

        // Admin override
        if (permissions.includes('admin')) return true;

        const requiredPerm = permissionMap[item.title];
        if (!requiredPerm) return true;

        return permissions.includes(requiredPerm);
    });

    return (
        <>
            <AppShell variant="sidebar">
                {!showBottomNav && <AppSidebar />}
                <AppContent 
                    variant="sidebar" 
                    className={`overflow-x-hidden ${showBottomNav ? 'pb-20 pt-safe' : ''}`}
                    style={showBottomNav ? { paddingTop: 'max(1.5rem, env(safe-area-inset-top))' } : undefined}
                >
                    <AppSidebarHeader
                        breadcrumbs={breadcrumbs}
                        headerActions={headerActions}
                        showUserProfile={showBottomNav}
                    />
                    {children}
                </AppContent>
            </AppShell>
            {showBottomNav && <BottomNav items={filteredNavItems} />}
        </>
    );
}

