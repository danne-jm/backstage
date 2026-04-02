import * as React from 'react';
import { cn } from '@backstage/lib/utils';

/**
 * Base component for form sections
 * Provides consistent styling and structure for form sections
 */
interface BaseFormSectionProps {
    title?: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    headerActions?: React.ReactNode;
}

export function BaseFormSection({
    title,
    description,
    children,
    className,
    headerActions,
}: BaseFormSectionProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {(title || description || headerActions) && (
                <div className="flex items-start justify-between">
                    <div>
                        {title && (
                            <h4 className="text-sm font-semibold">{title}</h4>
                        )}
                        {description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>
                    {headerActions && <div>{headerActions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
