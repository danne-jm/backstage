import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@backstage/components/ui/button';
import { Label } from '@backstage/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@backstage/components/ui/select';
import AppLayout from '@backstage/layouts/app-layout';
import type { BreadcrumbItem } from '@backstage/types';
import { EmailComposer } from '@backstage/components/email-distributor/email-composer';
import { TemplateSelector } from '@backstage/components/email-distributor/template-selector';
import { EventSelector } from '@backstage/components/email-distributor/event-selector';
import { EventDetails } from '@backstage/components/email-distributor/event-details';
import { FieldMappingSection } from '@backstage/components/email-distributor/field-mapping-section';
import { DataSourcePreview } from '@backstage/components/email-distributor/data-source-preview';
import { EmailPreview } from '@backstage/components/email-distributor/email-preview';
import { DistributionDialog } from '@backstage/components/email-distributor/distribution-dialog';
import { MailTypeSelector } from '@backstage/components/email-distributor/mail-type-selector';
import { NullableFieldsSection } from '@backstage/components/email-distributor/nullable-fields-section';
import { useEmailDistribution } from '@backstage/hooks/use-email-distribution';

interface EmailDistributorProps {
    events: any[];
    templates: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Email Distributor',
        href: '/email-distributor',
    },
];

export default function EmailDistributor() {
    const props = usePage().props as any;

    const {
        // Event & template
        selectedEventId,
        setSelectedEventId,
        selectedEvent,
        selectedTemplateId,
        setSelectedTemplateId,

        // Attendee data
        attendeeData,
        isFiltered,
        fields,

        // Field mapping
        firstNameField,
        setFirstNameField,
        lastNameField,
        setLastNameField,
        emailField,
        setEmailField,

        // Mail mode
        mailMode,
        setMailMode,
        nullableFields,
        setNullableFields,
        qrLogo,
        setQrLogo,
        setQrLogoBase64,
        handleQrLogoUpload,

        // Email composition
        subject,
        setSubject,
        editorContent,
        setEditorContent,

        // Preview
        generatedEmails,
        generatePreview,
        selectedSampleIndex,
        setSelectedSampleIndex,
        showRendered,
        setShowRendered,

        // Distribution
        canSend,
        isConfigDirty,
        isDistributing,
        dialogOpen,
        setDialogOpen,
        distributionError,
        distribute,
        hasSpreadsheetConfigured,
        successMessage,

        // Verification
        isValidating,
        isVerifyingEmails,
        emailVerificationResults,
        validationResults,
        validatePurchases,
        verifyEmails,
    } = useEmailDistribution({
        events: props.events || [],
        templates: props.templates || [],
    });

    const handleNullableFieldChange = (field: string, value: boolean) => {
        setNullableFields((prev) => ({ ...prev, [field]: value }));
    };

    // Helper to format attendee name for display
    const getAttendeeName = (attendee: any): string => {
        if (!attendee) return '';

        const firstName = attendee[firstNameField];
        const lastName = attendee[lastNameField];

        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        }
        if (firstName) return firstName;
        if (lastName) return lastName;

        // Fallback to first available field
        const firstAvailableField = fields[0];
        return attendee[firstAvailableField] || '';
    };

    const headerActions = (
        <Link href="/email-distributor/mails">
            <Button variant="outline" size="sm">All Mails</Button>
        </Link>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <Head title="Email Distributor" />

            {/* Success notification */}
            {successMessage && (
                <div className="fixed top-20 right-6 z-50">
                    <div className="rounded-md bg-emerald-600 px-4 py-2 text-white shadow">
                        {successMessage}
                    </div>
                </div>
            )}

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Main content grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Left column: Email composition */}
                    <div className="space-y-4 md:col-span-2">
                        <EmailComposer
                            subject={subject}
                            onSubjectChange={setSubject}
                            body={editorContent}
                            onBodyChange={setEditorContent}
                            templateSelector={
                                <TemplateSelector
                                    templates={props.templates || []}
                                    selectedId={selectedTemplateId}
                                    onChange={setSelectedTemplateId}
                                />
                            }
                        />

                        {/* Event and sample selector */}
                        <div className="flex flex-wrap items-end gap-4">
                            <EventSelector
                                events={props.events || []}
                                selectedEventId={selectedEventId}
                                onChange={setSelectedEventId}
                            />

                            <div className="flex max-w-[320px] min-w-[220px] flex-1 flex-col space-y-2">
                                <Label htmlFor="sample-user-select">Sample User</Label>
                                <Select
                                    value={String(selectedSampleIndex ?? 0)}
                                    onValueChange={(val) => setSelectedSampleIndex(Number(val))}
                                    disabled={!attendeeData || attendeeData.length === 0}
                                >
                                    <SelectTrigger id="sample-user-select" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {!hasSpreadsheetConfigured ? (
                                            <SelectItem value="0">No spreadsheet linked</SelectItem>
                                        ) : !attendeeData || attendeeData.length === 0 ? (
                                            <SelectItem value="0">No attendees found</SelectItem>
                                        ) : (
                                            attendeeData.map((attendee, idx) => (
                                                <SelectItem key={idx} value={String(idx)}>
                                                    {getAttendeeName(attendee) || `User ${idx + 1}`}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col justify-end">
                                <div className="flex gap-2">
                                    <Button onClick={generatePreview}>
                                        Generate Preview
                                    </Button>
                                    {canSend && (
                                    <Button
                                        onClick={() => setDialogOpen(true)}
                                        disabled={
                                            isDistributing ||
                                            isConfigDirty ||
                                            !generatedEmails
                                        }
                                        variant="destructive"
                                        title={
                                            isConfigDirty
                                                ? 'Generate preview first'
                                                : ''
                                        }
                                    >
                                        {isDistributing ? (
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
                                            'Distribute (real)'
                                        )}
                                    </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Event details */}
                        <EventDetails event={selectedEvent} />
                    </div>

                    {/* Right column: Field mapping and data preview */}
                    <aside className="space-y-6">
                        <FieldMappingSection
                            fields={fields}
                            firstNameField={firstNameField}
                            lastNameField={lastNameField}
                            emailField={emailField}
                            onFirstNameChange={setFirstNameField}
                            onLastNameChange={setLastNameField}
                            onEmailChange={setEmailField}
                        >
                            <MailTypeSelector
                                mailMode={mailMode}
                                onChange={setMailMode}
                                qrLogo={qrLogo}
                                onLogoUpload={handleQrLogoUpload}
                                onClearLogo={() => {
                                    setQrLogo(null);
                                    setQrLogoBase64(null);
                                }}
                            />

                            <div className="h-4"></div>

                            <NullableFieldsSection
                                fields={fields}
                                nullableFields={nullableFields}
                                onChange={handleNullableFieldChange}
                            />
                        </FieldMappingSection>

                        <DataSourcePreview
                            data={attendeeData}
                            fields={fields}
                            firstNameField={firstNameField}
                            lastNameField={lastNameField}
                            emailField={emailField}
                            isFiltered={isFiltered}
                            verificationActions={
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={validatePurchases}
                                        disabled={isValidating || !hasSpreadsheetConfigured}
                                        className="h-7 text-[10px]"
                                    >
                                        {isValidating ? 'Validating...' : 'Verify Payments'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={verifyEmails}
                                        disabled={isVerifyingEmails || !hasSpreadsheetConfigured}
                                        className="h-7 text-[10px]"
                                    >
                                        {isVerifyingEmails ? 'Verifying...' : 'Verify Domains'}
                                    </Button>
                                </>
                            }
                            emailVerificationResults={emailVerificationResults}
                            validationResults={validationResults}
                        />
                    </aside>
                </div>

                {/* Email preview section */}
                <div className="px-4 pb-4">
                    <h4 className="text-sm font-semibold mb-2">
                        Generated Payload Preview
                    </h4>
                    <EmailPreview
                        generatedEmails={generatedEmails}
                        selectedIndex={selectedSampleIndex ?? 0}
                        showRendered={showRendered}
                        onToggleView={setShowRendered}
                        hasEventSelected={!!selectedEventId}
                        hasSpreadsheetConfigured={hasSpreadsheetConfigured}
                        qrLogo={qrLogo}
                    />
                </div>

                {/* Distribution dialog */}
                <DistributionDialog
                    open={dialogOpen}
                    onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                            // Clear error when dialog closes
                            setTimeout(() => {
                                // Delay to allow dialog animation
                            }, 300);
                        }
                    }}
                    recipientCount={generatedEmails?.length || 0}
                    onConfirm={distribute}
                    isLoading={isDistributing}
                    error={distributionError}
                />
            </div >
        </AppLayout >
    );
}
