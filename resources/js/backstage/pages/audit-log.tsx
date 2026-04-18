import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import { Input } from '@backstage/components/ui/input';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Audit Log', href: '/audit-log' },
];

type Activity = {
    id: number;
    log_name: string | null;
    description: string;
    event: string | null;
    subject_type: string | null;
    subject_id: string | null;
    causer_name: string | null;
    causer_email: string | null;
    properties: Record<string, any>;
    created_at: string;
};

type PaginatedActivities = {
    data: Activity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
};

const LOG_NAME_COLORS: Record<string, string> = {
    auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    users: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    sellables: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inventory: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    office: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    email_distributor: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    ticket_scanner: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    settings: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function logBadgeClass(logName: string | null): string {
    return logName && LOG_NAME_COLORS[logName]
        ? LOG_NAME_COLORS[logName]
        : 'bg-muted text-muted-foreground';
}

function hasRealProperties(activity: Activity): boolean {
    if (!activity.properties || Object.keys(activity.properties).length === 0) return false;
    // Skip entries that only have an empty attributes object
    const keys = Object.keys(activity.properties);
    if (keys.length === 1 && keys[0] === 'attributes') {
        return Object.keys(activity.properties.attributes ?? {}).length > 0;
    }
    return true;
}

export default function AuditLog() {
    const { activities } = usePage().props as { activities: PaginatedActivities };
    const [search, setSearch] = React.useState('');
    const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return activities.data;
        return activities.data.filter(
            (a) =>
                a.description.toLowerCase().includes(q) ||
                (a.log_name ?? '').toLowerCase().includes(q) ||
                (a.causer_name ?? '').toLowerCase().includes(q) ||
                (a.causer_email ?? '').toLowerCase().includes(q) ||
                (a.subject_type ?? '').toLowerCase().includes(q),
        );
    }, [activities.data, search]);

    function toggleExpanded(id: number) {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function goToPage(url: string | null) {
        if (!url) return;
        router.visit(url, { preserveState: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />

            <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold sm:text-2xl">Audit Log</h1>
                        <p className="text-sm text-muted-foreground">
                            {activities.total} events recorded
                        </p>
                    </div>
                    <Input
                        className="w-full sm:w-64"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table — scrollable on mobile, full columns on desktop */}
                <div className="rounded-lg border">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-3 sm:px-4">When</th>
                                    <th className="px-3 py-3 sm:px-4">Section</th>
                                    <th className="px-3 py-3 sm:px-4">Event</th>
                                    <th className="hidden px-4 py-3 sm:table-cell">Who</th>
                                    <th className="hidden px-4 py-3 lg:table-cell">Subject</th>
                                    <th className="px-3 py-3 sm:px-4">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                            No events found.
                                        </td>
                                    </tr>
                                )}
                                {filtered.map((activity) => {
                                    const showProps = hasRealProperties(activity);
                                    const isExpanded = expanded.has(activity.id);

                                    return (
                                        <React.Fragment key={activity.id}>
                                            <tr className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground sm:px-4">
                                                    <span className="hidden sm:inline">{formatDate(activity.created_at)}</span>
                                                    <span className="sm:hidden">{formatDateShort(activity.created_at)}</span>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4">
                                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${logBadgeClass(activity.log_name)}`}>
                                                        {activity.log_name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-medium sm:px-4">{activity.description}</td>
                                                <td className="hidden px-4 py-3 sm:table-cell">
                                                    {activity.causer_name ? (
                                                        <div>
                                                            <div className="text-sm">{activity.causer_name}</div>
                                                            <div className="text-xs text-muted-foreground">{activity.causer_email}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">System</span>
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                                                    {activity.subject_type ? (
                                                        <span>
                                                            {activity.subject_type}
                                                            {activity.subject_id && (
                                                                <span className="ml-1 text-xs opacity-60">
                                                                    #{activity.subject_id.slice(0, 8)}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-3 py-3 sm:px-4">
                                                    {showProps && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpanded(activity.id)}
                                                            className="text-xs text-primary underline-offset-2 hover:underline"
                                                        >
                                                            {isExpanded ? 'Hide' : 'View'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {isExpanded && showProps && (
                                                <tr className="border-b bg-muted/20">
                                                    <td colSpan={6} className="px-3 pb-3 pt-0 sm:px-4">
                                                        <pre className="max-h-48 overflow-auto rounded bg-muted p-3 text-xs">
                                                            {JSON.stringify(activity.properties, null, 2)}
                                                        </pre>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {activities.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {activities.from}–{activities.to} of {activities.total}
                        </span>
                        <div className="flex flex-wrap items-center gap-1">
                            {activities.links.map((link, i) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button key={i} variant="outline" size="sm" disabled={!link.url} onClick={() => goToPage(link.url)}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                    );
                                }
                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <Button key={i} variant="outline" size="sm" disabled={!link.url} onClick={() => goToPage(link.url)}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                }
                                return (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => goToPage(link.url)}
                                    >
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
