import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
// Use a static path for the Google settings link to avoid a runtime helper collision
const googlePath = '/settings/google';
// footer settings page uses a static path; the route helper may not exist in all environments
const editFooterPath = '/settings/footer';


function getSidebarNavItems() {
    const { auth } = usePage().props as any;
    const items: NavItem[] = [
        {
            title: 'Profile',
            href: edit(),
            icon: null,
        },
        {
            title: 'Password',
            href: editPassword(),
            icon: null,
        },
        {
            title: 'Two-Factor Auth',
            href: show(),
            icon: null,
        },
        {
            title: 'Appearance',
            href: editAppearance(),
            icon: null,
        },
    ];
    // Check if user has 'admin' in permissions array
    const permissions = auth?.user?.permissions || [];
    const hasAdminPermission = Array.isArray(permissions) && permissions.includes('admin');
    if (hasAdminPermission) {
        items.push({
            title: 'Users',
            href: '/settings/users',
            icon: null,
        });
    }
    items.push(
        {
            title: 'Google',
            href: googlePath,
            icon: null,
        },
        {
            title: 'Footer',
            href: editFooterPath,
            icon: null,
        }
    );
    return items;
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') {
        return null;
    }
    const currentPath = window.location.pathname;
    const sidebarNavItems = getSidebarNavItems();
    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />
            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${resolveUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isSameUrl(
                                        currentPath,
                                        item.href,
                                    ),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>
                <Separator className="my-6 lg:hidden" />
                <div className="flex-1">
                    <section className="space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
