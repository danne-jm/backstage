import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/Components/Shared/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    // Allow pages to force which sidebar item is active by setting
    // document.documentElement.dataset.activeSidebar to a path (e.g. '/sellables').
    const forcedActive =
        typeof document !== 'undefined'
            ? document.documentElement.dataset.activeSidebar
            : undefined;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const itemUrl = resolveUrl(item.href);
                    // Handle both absolute and relative URLs by using a dummy base
                    const itemPath = new URL(itemUrl, 'http://base.com')
                        .pathname;
                    const pagePath = new URL(page.url, 'http://base.com')
                        .pathname;
                    const forcedPath = forcedActive
                        ? new URL(resolveUrl(forcedActive), 'http://base.com')
                              .pathname
                        : null;

                    const isActive = forcedPath
                        ? itemPath === forcedPath
                        : pagePath.startsWith(itemPath);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
