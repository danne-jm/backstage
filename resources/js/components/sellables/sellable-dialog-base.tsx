import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';

interface SellableDialogBaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    children: React.ReactNode;
    onSubmit: () => void;
    submitLabel: string;
    footerExtra?: React.ReactNode;
}

export function SellableDialogBase({
    open,
    onOpenChange,
    title,
    description,
    children,
    onSubmit,
    submitLabel,
    footerExtra,
}: SellableDialogBaseProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-full overflow-y-auto p-4 sm:max-w-[70vw] sm:p-6">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                <div className="space-y-6">{children}</div>
                <DialogFooter className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {footerExtra}
                    <div className="flex w-full justify-end gap-2 sm:w-auto">
                        <DialogClose asChild>
                            <Button variant="ghost">Cancel</Button>
                        </DialogClose>
                        <Button onClick={onSubmit}>{submitLabel}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
