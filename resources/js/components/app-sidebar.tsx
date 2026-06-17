import { Link, usePage } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as inventory } from '@/routes/backstage/inventory';
import { index as sellables } from '@/routes/backstage/sellables';
import { index as office } from '@/routes/backstage/office';
import { root as ticketScanner } from '@/routes/backstage/ticket-scanner';
import { index as emailDistributor } from '@/routes/backstage/email-distributor';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LucideIcons.LayoutGrid,
    },
    {
        title: 'Office Shifts',
        href: office().url,
        icon: LucideIcons.Building2,
    },
    {
        title: 'Sellables',
        href: sellables().url,
        icon: LucideIcons.ShoppingBag,
    },
    {
        title: 'Ticket Scanner',
        href: ticketScanner().url,
        icon: LucideIcons.QrCode,
    },
    {
        title: 'Email Distributor',
        href: emailDistributor().url,
        icon: LucideIcons.Mail,
    },
    {
        title: 'Inventory',
        href: inventory().url,
        icon: LucideIcons.Warehouse,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: any }>().props;
    const userPinned = auth?.user?.pinned || [];
    
    const dynamicFooterItems: NavItem[] = userPinned.map((pin: any) => ({
        title: pin.title,
        href: pin.url,
        icon: LucideIcons[pin.icon as keyof typeof LucideIcons] || LucideIcons.Link,
    }));

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
                {dynamicFooterItems.length > 0 && (
                    <NavFooter items={dynamicFooterItems} className="mt-auto" />
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
