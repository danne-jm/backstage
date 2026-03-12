import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface BaseModalProps {
    isOpen: boolean;
    onClose: (isOpen: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function BaseModal({
    isOpen,
    onClose,
    title,
    description,
    children,
    className = 'sm:max-w-[400px]',
}: BaseModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`rounded-xl border-sidebar-border bg-background text-foreground shadow-lg ${className}`}
            >
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-lg font-semibold">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-muted-foreground">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-2">{children}</div>
            </DialogContent>
        </Dialog>
    );
}
