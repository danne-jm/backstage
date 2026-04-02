import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    LayoutGrid,
    ScanText,
    ShoppingBag,
    Store,
    Ticket,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@backstage/components/app-logo';
import { NavFooter } from '@backstage/components/nav-footer';
import { NavMain } from '@backstage/components/nav-main';
import { NavUser } from '@backstage/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@backstage/components/ui/sidebar';
import {
    dashboard,
    sellables,
    ticketScanner,
    emailDistributor,
    inventory,
    storeManager,
    office,
} from '@backstage/routes';
import type { NavItem } from '@backstage/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Office Shifts',
        href: office(),
        icon: Building2,
    },
    {
        title: 'Sellables',
        href: sellables(),
        icon: ShoppingBag,
    },
    {
        title: 'Ticket Scanner',
        href: ticketScanner(),
        icon: ScanText,
    },
    {
        title: 'Email Distributor',
        href: emailDistributor(),
        icon: Ticket,
    },
    {
        title: 'Inventory',
        href: inventory(),
        icon: Warehouse,
    },
    {
        title: 'Store Manager',
        href: storeManager(),
        icon: Store,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const footerLinks = auth.user.footer_links ?? [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerLinks} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
