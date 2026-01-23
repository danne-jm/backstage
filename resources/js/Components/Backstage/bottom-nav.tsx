import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface BottomNavProps {
    items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
    const page = usePage();

    // Remove ticket-distributor from PWA bottom nav
    const filteredItems = items.filter(item => item.title !== 'Ticket Distributor');

    // Allow pages to force which nav item is active
    const forcedActive =
        typeof document !== 'undefined'
            ? document.documentElement.dataset.activeSidebar
            : undefined;

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background shadow-lg"
            style={{ 
                height: 'calc(3.25rem + env(safe-area-inset-bottom))',
                minHeight: 'calc(3.25rem + env(safe-area-inset-bottom))',
                maxHeight: 'calc(3.25rem + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className="flex items-center justify-around px-1" style={{ height: '3.25rem', minHeight: '3.25rem', maxHeight: '3.25rem' }}>
                {filteredItems.map((item) => {
                    const itemUrl = resolveUrl(item.href);
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
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            aria-label={item.title}
                            className="flex items-center justify-center p-2"
                            style={{ 
                                height: '3.5rem', 
                                minHeight: '3.5rem', 
                                maxHeight: '3.5rem',
                                width: `${100 / filteredItems.length}%`,
                                flexShrink: 0
                            }}
                        >
                            {item.icon && (
                                <item.icon
                                    className={`${
                                        isActive
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                    }`}
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    style={{ flexShrink: 0 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
