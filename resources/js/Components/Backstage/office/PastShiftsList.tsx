import { Button } from '@/Components/Shared/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/Components/Shared/ui/dialog';
import { Link, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { formatTimestamp } from './utils';

interface PastShiftsListProps {
    shifts: any[];
    setMessage: (msg: string) => void;
    canDelete?: boolean;
}

export function PastShiftsList({
    shifts,
    setMessage,
    canDelete = true,
}: PastShiftsListProps) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <h3 className="mb-4 text-sm font-semibold">All Office Shifts</h3>
            {shifts && shifts.length > 0 ? (
                <div className="space-y-3">
                    {shifts.map((s: any) => (
                        <div
                            key={s.id}
                            className="flex items-center justify-between rounded-md bg-muted/40 p-3"
                        >
                            <div>
                                <div className="text-sm font-medium">
                                    {formatTimestamp(s.started_at)} —{' '}
                                    {formatTimestamp(s.ended_at)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {Array.isArray(s.workers) &&
                                    s.workers.length > 0
                                        ? s.workers
                                              .map((w: any) => w.name)
                                              .slice(0, 3)
                                              .join(', ')
                                        : 'No workers'}
                                    {Array.isArray(s.workers) &&
                                    s.workers.length > 3
                                        ? ` +${s.workers.length - 3} more`
                                        : ''}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-sm text-muted-foreground">
                                    €
                                    {(
                                        Number(s.total_cash ?? 0) +
                                        Number(s.total_card ?? 0)
                                    ).toFixed(2)}
                                </div>
                                <Link href={`/office/${s.id}`}>
                                    <Button size="sm" variant="ghost">
                                        Review
                                    </Button>
                                </Link>
                                {canDelete && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-muted/30"
                                            >
                                                Remove
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>
                                                Delete this office shift?
                                            </DialogTitle>
                                            <DialogDescription>
                                                Deleting a shift will
                                                permanently remove its sales and
                                                worker history. This action
                                                cannot be undone. Are you sure?
                                            </DialogDescription>
                                            <DialogFooter className="gap-2">
                                                <DialogClose asChild>
                                                    <Button variant="secondary">
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <DialogClose asChild>
                                                    <Button
                                                        variant="destructive"
                                                        onClick={() => {
                                                            router.post(
                                                                `/office/${s.id}/delete`,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    onStart:
                                                                        () => {},
                                                                    onSuccess:
                                                                        () => {
                                                                            setMessage(
                                                                                'Shift deleted',
                                                                            );
                                                                            setTimeout(
                                                                                () =>
                                                                                    router.get(
                                                                                        route(
                                                                                            'office',
                                                                                        ),
                                                                                        {},
                                                                                        {
                                                                                            preserveScroll: true,
                                                                                            preserveState: true,
                                                                                            replace: true,
                                                                                        },
                                                                                    ),
                                                                                500,
                                                                            );
                                                                        },
                                                                    onError:
                                                                        () =>
                                                                            setMessage(
                                                                                'Failed to delete shift',
                                                                            ),
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    No office shifts available
                </div>
            )}
        </div>
    );
}
