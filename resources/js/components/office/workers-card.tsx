import { router } from '@inertiajs/react';
import { User } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function WorkersCard({ workers, activeShift, staff }: any) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Ensure staff list shows users who are currently on the shift first.
    // We create a sorted copy so we don't mutate the original prop.
    const sortedStaff = Array.isArray(staff)
        ? [...staff].sort((a: any, b: any) => {
              const aOnShift = Array.isArray(workers)
                  ? workers.some((w: any) => w.id === a.id)
                  : false;
              const bOnShift = Array.isArray(workers)
                  ? workers.some((w: any) => w.id === b.id)
                  : false;

              // Put on-shift users first
              if (aOnShift && !bOnShift) return -1;
              if (!aOnShift && bOnShift) return 1;

              // Otherwise sort by name for consistency
              try {
                  return String(a.name).localeCompare(String(b.name));
              } catch {
                  return 0;
              }
          })
        : [];

    const handleAddWorker = (userId: string) => {
        if (!userId || !activeShift?.id) return;
        setProcessingId(userId);
        router.post(
            `/office/${activeShift.id}/workers`,
            { user_id: userId },
            {
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const handleRemoveWorker = (userId: string) => {
        if (!activeShift?.id) return;
        setProcessingId(userId);
        router.delete(`/office/${activeShift.id}/workers`, {
            data: { user_id: userId },
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <section className="flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Workers</h3>
            </div>
            <div className="mt-4">
                <ul className="flex flex-col divide-y divide-sidebar-border/50">
                    {sortedStaff?.map((member: any) => {
                        const isOnShift = workers?.some(
                            (w: any) => w.id === member.id,
                        );
                        const isProcessing = processingId === member.id;

                        return (
                            <li
                                key={member.id}
                                className="flex items-center justify-between py-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-full bg-muted/50 p-2">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {member.name}
                                            </span>
                                            {String(member.id) ===
                                                String(
                                                    activeShift?.started_by,
                                                ) && (
                                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                                    Started by
                                                </span>
                                            )}
                                            {activeShift?.status === 'closed' &&
                                                String(member.id) ===
                                                    String(
                                                        activeShift?.ended_by,
                                                    ) && (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-400">
                                                        Closed by
                                                    </span>
                                                )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {member.role || 'User'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isOnShift ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={
                                                isProcessing ||
                                                activeShift?.status !== 'open'
                                            }
                                            onClick={() =>
                                                handleAddWorker(member.id)
                                            }
                                        >
                                            Add
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:bg-muted/30"
                                                disabled={
                                                    isProcessing ||
                                                    activeShift?.status !==
                                                        'open'
                                                }
                                                onClick={() =>
                                                    handleRemoveWorker(
                                                        member.id,
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                On shift
                                            </div>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
                {(!staff || staff.length === 0) && (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                        No staff available.
                    </div>
                )}
            </div>
        </section>
    );
}
