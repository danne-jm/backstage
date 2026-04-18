import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
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
import { index as auditLogIndex } from '@backstage/routes/audit-log';
import type { NavItem } from '@backstage/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        permission: 'view_dashboard',
    },
    {
        title: 'Office Shifts',
        href: office(),
        icon: Building2,
        permission: 'view_office',
    },
    {
        title: 'Sellables',
        href: sellables(),
        icon: ShoppingBag,
        permission: 'view_sellables',
    },
    {
        title: 'Ticket Scanner',
        href: ticketScanner(),
        icon: ScanText,
        permission: 'view_ticket_scanner',
    },
    {
        title: 'Email Distributor',
        href: emailDistributor(),
        icon: Ticket,
        permission: 'view_mail_distributor',
    },
    {
        title: 'Inventory',
        href: inventory(),
        icon: Warehouse,
        permission: 'view_inventory',
    },
    {
        title: 'Store Manager',
        href: storeManager(),
        icon: Store,
        permission: 'view_store_manager',
    },
    {
        title: 'Audit Log',
        href: auditLogIndex(),
        icon: ClipboardList,
        permission: 'view_audit_log',
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const footerLinks = auth.user.footer_links ?? [];
    const userPermissions: string[] = (auth.user.permissions as string[]) ?? [];

    const visibleNavItems = mainNavItems.filter(
        (item) => !item.permission || userPermissions.includes(item.permission),
    );

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
                <NavMain items={visibleNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerLinks} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
