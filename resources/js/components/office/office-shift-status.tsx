import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { OfficeCard } from './office-card';
import { formatTimestamp } from './utils';

interface OfficeShiftStatusProps {
    activeShift: any;
    className?: string; // Add className prop
}

export function OfficeShiftStatus({
    activeShift,
    className,
    canCreate = true, // Default to true if not provided
}: OfficeShiftStatusProps & { canCreate?: boolean }) {
    return (
        <OfficeCard title="Office Shift Status" className={className}>
            {activeShift ? (
                <div className="space-y-3">
                    <div className="rounded-md bg-green-50 p-3 dark:bg-green-950/20">
                        <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                            Active Shift in Progress
                        </div>
                        <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                            Started: {formatTimestamp(activeShift.started_at)}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            Current Workers
                        </div>
                        <div className="mt-1 text-sm">
                            {Array.isArray(activeShift.workers_list) &&
                            activeShift.workers_list.length > 0
                                ? activeShift.workers_list
                                      .map((w: any) => w.name)
                                      .join(', ')
                                : 'None'}
                        </div>
                    </div>
                    <Link href={`/office/${activeShift.id}`}>
                        <Button className="w-full" variant="default">
                            Manage Active Shift
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="rounded-md bg-muted/40 p-3">
                        <div className="text-sm font-medium">
                            No Active Shift
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            Start a new shift to begin tracking sales and
                            workers
                        </div>
                    </div>
                    {canCreate && (
                        <Button
                            className="w-full"
                            variant="default"
                            onClick={() => router.post('/office/start')}
                        >
                            Start Office Shift
                        </Button>
                    )}
                </div>
            )}
        </OfficeCard>
    );
}
