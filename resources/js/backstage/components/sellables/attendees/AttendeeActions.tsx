import * as React from 'react';
import { Button } from '@backstage/components/ui/button';
import { CheckCircle2, Filter, Loader2, MailCheck } from 'lucide-react';

interface AttendeeActionsProps {
    isValidating: boolean;
    validatePurchases: () => void;
    isVerifyingEmails: boolean;
    verifyEmails: () => void;
    setIsFilterOpen: (open: boolean) => void;
    filterCount: number;
    hasData: boolean;
    hasPurchaseIdCol: boolean;
    hasEmailCol: boolean;
}

export function AttendeeActions({
    isValidating,
    validatePurchases,
    isVerifyingEmails,
    verifyEmails,
    setIsFilterOpen,
    filterCount,
    hasData,
    hasPurchaseIdCol,
    hasEmailCol,
}: AttendeeActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                onClick={validatePurchases}
                disabled={isValidating || !hasPurchaseIdCol || !hasData}
                title={!hasPurchaseIdCol ? 'No purchase_identifier column found' : 'Validate payments'}
            >
                {isValidating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Validate Payments
            </Button>

            <Button
                variant="outline"
                onClick={verifyEmails}
                disabled={isVerifyingEmails || !hasEmailCol || !hasData}
                title={!hasEmailCol ? 'No email column found' : 'Verify email domains'}
            >
                {isVerifyingEmails ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <MailCheck className="mr-2 h-4 w-4" />
                )}
                Verify Domains
            </Button>

            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFilterOpen(true)}
                className="relative"
            >
                <Filter className="h-4 w-4" />
                {filterCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {filterCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
