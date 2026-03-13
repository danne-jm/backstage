import * as React from 'react';

/**
 * Email preview component
 * Shows rendered HTML preview of the email or JSON payload
 */
interface GeneratedEmail {
    email: string;
    subject: string;
    body: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

interface EmailPreviewProps {
    generatedEmails: GeneratedEmail[] | null;
    selectedIndex: number;
    showRendered: boolean;
    onToggleView: (showRendered: boolean) => void;
    hasEventSelected?: boolean;
    hasSpreadsheetConfigured?: boolean;
}

export function EmailPreview({
    generatedEmails,
    selectedIndex,
    showRendered,
    onToggleView,
    hasEventSelected,
    hasSpreadsheetConfigured,
}: EmailPreviewProps) {
    if (!generatedEmails || generatedEmails.length === 0) {
        let message = "No preview generated yet. Click Generate Preview.";

        if (!hasEventSelected) {
            message = "Select an event to begin.";
        } else if (!hasSpreadsheetConfigured) {
            message = "This event has no attendee spreadsheet linked. Please configure it in the Attendees page.";
        } else if (generatedEmails !== null) {
            message = "No attendees found in the linked spreadsheet.";
        }

        return (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                {message}
            </div>
        );
    }

    const selectedEmail = generatedEmails[selectedIndex] || generatedEmails[0];

    return (
        <div>
            <div className="flex items-center gap-2 pb-2">
                <div
                    role="tablist"
                    aria-orientation="horizontal"
                    className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!showRendered}
                        onClick={() => onToggleView(false)}
                        className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] ${!showRendered
                                ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30'
                                : 'text-foreground dark:text-muted-foreground'
                            }`}
                    >
                        JSON
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={showRendered}
                        onClick={() => onToggleView(true)}
                        className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] ${showRendered
                                ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30'
                                : 'text-foreground dark:text-muted-foreground'
                            }`}
                    >
                        HTML Preview
                    </button>
                </div>
            </div>

            <div className="mt-2">
                {!showRendered && (
                    <pre className="rounded bg-muted p-3 text-xs overflow-auto max-h-[500px]">
                        {JSON.stringify(generatedEmails, null, 2)}
                    </pre>
                )}

                {showRendered && (
                    <div className="rounded-xl border bg-white p-6 text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100">
                        <div
                            className="prose max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{
                                __html: selectedEmail.body.replace(
                                    /{{qr}}/g,
                                    '<div style="background:rgba(255, 255, 255, 1);border:2px dashed rgba(0, 0, 0, 1);width:150px;height:150px;padding:8px;box-sizing:border-box;margin:0;font-weight:bold;text-align:center;display:flex;align-items:center;justify-content:center;">QR PREVIEW</div>'
                                ),
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
