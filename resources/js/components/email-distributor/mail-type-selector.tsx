import * as React from 'react';
import { BaseFormSection } from './base-form-section';
import { Label } from '@/components/ui/label';

/**
 * Mail type selector component
 * Allows switching between normal mail and mail with QR embedding
 */
interface MailTypeSelectorProps {
    mailMode: 'normal' | 'qr';
    onChange: (mode: 'normal' | 'qr') => void;
}

export function MailTypeSelector({
    mailMode,
    onChange,
}: MailTypeSelectorProps) {
    return (
        <BaseFormSection
            title="Mail type"
            description="Choose if this is a standard mail or includes a QR code"
        >
            <div className="space-y-3">
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mailMode"
                            value="normal"
                            checked={mailMode === 'normal'}
                            onChange={() => onChange('normal')}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm font-medium">Normal mail</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="mailMode"
                            value="qr"
                            checked={mailMode === 'qr'}
                            onChange={() => onChange('qr')}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm font-medium">Mail with QR embedding</span>
                    </label>
                </div>

                {mailMode === 'qr' && (
                    <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground border border-dashed">
                        <p>
                            <strong>QR Mode Active:</strong> Event name and date will be taken from the selected event.
                            Use <code>{`{{qr}}`}</code> in your message where you want the QR image to appear.
                        </p>
                    </div>
                )}
            </div>
        </BaseFormSection>
    );
}
