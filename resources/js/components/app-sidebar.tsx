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
import {
    dashboard,
    office,
    sellables,
    storeManager,
    ticketing,
    ticketScanner,
    warehouse,
} from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    ChevronDown,
    Container,
    ExternalLink,
    Github,
    Globe,
    Instagram,
    LayoutGrid,
    Link as LinkIcon,
    Mail,
    PackageOpen,
    ScanText,
    ShoppingBag,
    Store,
    Ticket,
    TreeDeciduous,
    Twitter,
    Warehouse,
} from 'lucide-react';
import * as React from 'react';
import AppLogo from './app-logo';

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
        title: 'Ticketing Distributor',
        href: ticketing(),
        icon: Ticket,
    },
    {
        title: 'Basement Inventory',
        href: warehouse(),
        icon: Warehouse,
    },
    {
        title: 'Store Manager',
        href: storeManager(),
        icon: Store,
    },
];

// NOTE: do not hardcode default footer items here. Use server-provided `auth.user.pinned` instead.

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    // Footer collapse state for mobile only. Default collapsed.
    const [footerExpanded, setFooterExpanded] = React.useState<boolean>(false);

    // Footer toggle state is controlled by the toggle button on mobile.

    // Do not include any frontend defaults — rely solely on the persisted `pinned` value on the user.

    // Map of available icon components (a small set used for the footer). If the user's pinned uses a name
    // that isn't present here, fall back to Mails.
    const iconMap: Record<string, any> = {
        Mail,
        Mails: Mail,
        Container,
        Globe,
        ShoppingBag,
        Link: LinkIcon,
        ExternalLink,
        Github,
        Twitter,
        Instagram,
        BookOpen,
        PackageOpen,
        TreeDeciduous,
        Store,
    };

    const userPinned = Array.isArray(auth?.user?.pinned)
        ? auth.user.pinned
        : [];

    // Normalize footer nav items into NavItem[] shape expected by NavFooter
    const footerNavItems: NavItem[] = userPinned.map((it: any) => ({
        title: it.title,
        href: it.href,
        icon: iconMap[it.icon] ?? Mail,
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
                {/* Desktop / md+ footer (always visible) */}
                <div className="mt-auto hidden md:block">
                    <NavFooter items={footerNavItems} />
                    <NavUser />
                </div>

                {/* Mobile footer: collapsed by default, expandable via button or 'q' key */}
                <div className="mt-auto w-full md:hidden">
                    <div className="flex items-center justify-between px-3 py-2">
                        <button
                            type="button"
                            aria-expanded={footerExpanded}
                            aria-controls="sidebar-quicklinks"
                            onClick={() => setFooterExpanded((v) => !v)}
                            className="flex items-center gap-2 text-sm font-medium"
                        >
                            Quick links
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${footerExpanded ? 'rotate-180' : ''}`}
                            />
                        </button>
                    </div>

                    <div
                        id="sidebar-quicklinks"
                        className={`${footerExpanded ? 'block' : 'hidden'} px-3`}
                    >
                        <NavFooter items={footerNavItems} />
                    </div>

                    {/* Reduce top margin so the profile FAB sits closer to quick links on mobile */}
                    <div className="px-3">
                        <NavUser />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
