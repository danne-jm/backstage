import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@backstage/components/ui/dialog';

/**
 * Distribution confirmation dialog
 * Shows confirmation before sending emails or error details if distribution fails
 */
interface DistributionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    recipientCount: number;
    onConfirm: () => void;
    isLoading: boolean;
    error: {
        title: string;
        messages: string[];
    } | null;
}

export function DistributionDialog({
    open,
    onOpenChange,
    recipientCount,
    onConfirm,
    isLoading,
    error,
}: DistributionDialogProps) {
    if (error) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                    <DialogTitle className="text-destructive">
                        ❌ {error.title}
                    </DialogTitle>
                    <DialogDescription>
                        The following issues prevented distribution:
                    </DialogDescription>

                    <div className="mt-3 max-h-[300px] overflow-y-auto border border-dotted border-muted/30 bg-transparent p-4 text-sm text-foreground">
                        <ul className="list-disc space-y-1 pl-4">
                            {error.messages.map((msg, i) => (
                                <li key={i}>{msg}</li>
                            ))}
                        </ul>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                <DialogTitle>Confirm distribution</DialogTitle>
                <DialogDescription>
                    You are about to distribute the prepared email to{' '}
                    <strong>{recipientCount}</strong> recipients. This will
                    enqueue background jobs to send the messages.
                    <br />
                    <br />
                    Do you want to proceed?
                </DialogDescription>

                <div className="mt-4 text-xs text-muted-foreground">
                    Queued sending is recommended for large recipient lists and
                    will run in the background (run{' '}
                    <code>php artisan queue:work</code> to process).
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="ml-2"
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="mr-2 -ml-1 h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    />
                                </svg>
                                Sending...
                            </>
                        ) : (
                            'Confirm & Queue'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
