import * as React from 'react';
import { BaseFormSection } from './base-form-section';
import { Label } from '@backstage/components/ui/label';

/**
 * Mail type selector component
 * Allows switching between normal mail and mail with QR embedding
 */
interface MailTypeSelectorProps {
    mailMode: 'normal' | 'qr';
    onChange: (mode: 'normal' | 'qr') => void;
    qrLogo?: string | null;
    onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClearLogo?: () => void;
}

export function MailTypeSelector({
    mailMode,
    onChange,
    qrLogo,
    onLogoUpload,
    onClearLogo,
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
                    <div className="space-y-4">
                        <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground border border-dashed">
                            <p>
                                <strong>QR Mode Active:</strong> Event name and date will be taken from the selected event.
                                Use <code>{`{{qr}}`}</code> in your message where you want the QR image to appear.
                            </p>
                        </div>

                        <div className="space-y-2 pt-1 border-t border-border/50">
                            <Label className="text-xs">QR Code Logo (Optional)</Label>
                            <div className="flex items-start gap-4">
                                {qrLogo ? (
                                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border bg-white p-1">
                                        <img src={qrLogo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={onClearLogo}
                                            className="absolute top-0 right-0 rounded-bl-md bg-red-500 p-0.5 text-white hover:bg-red-600 focus:outline-none"
                                            title="Remove logo"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={onLogoUpload}
                                            className="block w-full text-xs text-slate-500
                                              file:mr-4 file:py-1.5 file:px-3
                                              file:rounded-md file:border-0
                                              file:text-xs file:font-semibold
                                              file:bg-primary/10 file:text-primary
                                              hover:file:bg-primary/20
                                            "
                                        />
                                        <p className="mt-1 text-[10px] text-muted-foreground">
                                            Will be embedded in the center of the QR code. Keep it simple and high contrast.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </BaseFormSection>
    );
}
