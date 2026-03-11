import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';

interface OfficeCardProps extends React.HTMLAttributes<HTMLElement> {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const OfficeCard = forwardRef<HTMLElement, OfficeCardProps>(
    ({ title, action, children, className, ...props }, ref) => {
        return (
            <section
                ref={ref}
                className={cn(
                    'flex flex-col rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border',
                    className,
                )}
                {...props}
            >
                <div className="mb-3 flex flex-row items-center justify-between">
                    <h3 className="text-sm font-semibold">{title}</h3>
                    {action && <div>{action}</div>}
                </div>
                <div className="flex flex-col min-h-0 flex-1">{children}</div>
            </section>
        );
    },
);
OfficeCard.displayName = 'OfficeCard';
