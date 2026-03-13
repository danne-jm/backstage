import * as React from 'react';
import axios from 'axios';

/**
 * Hook for managing email distribution state and logic
 * Encapsulates all the complex state management
 */
interface UseEmailDistributionProps {
    events: any[];
    templates: any[];
    permissions: string[];
}

export function useEmailDistribution({
    events,
    templates,
    permissions,
}: UseEmailDistributionProps) {
    // Permission check
    const canSend = React.useMemo(
        () =>
            permissions.includes('admin') ||
            permissions.includes('send_tickets'),
        [permissions]
    );

    // Event and template selection
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
        null
    );
    const [selectedTemplateId, setSelectedTemplateId] = React.useState<
        string | 'none'
    >('none');

    // Attendee data
    const [attendeeData, setAttendeeData] = React.useState<any[]>([]);
    const [isLoadingAttendees, setIsLoadingAttendees] = React.useState(false);

    // Field mapping
    const [firstNameField, setFirstNameField] = React.useState('');
    const [lastNameField, setLastNameField] = React.useState('');
    const [emailField, setEmailField] = React.useState('');

    // Email composition
    const [subject, setSubject] = React.useState('Your ticket information');
    const [editorContent, setEditorContent] = React.useState(`Hello {{firstName}} {{last_name}},

Thanks for registering — below are your ticket details for the event.

Event: {{event_name}}
Date: {{event_date}}
Bring: Your ESN card (if applicable)
Please bring a copy of this email (printed or on your phone).

See you there,
ESN Leuven`);

    // Preview
    const [generatedEmails, setGeneratedEmails] = React.useState<any[] | null>(
        null
    );
    const [selectedSampleIndex, setSelectedSampleIndex] = React.useState<
        number | null
    >(0);
    const [showRendered, setShowRendered] = React.useState(true);

    // Distribution
    const [isDistributing, setIsDistributing] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [distributionError, setDistributionError] = React.useState<{
        title: string;
        messages: string[];
    } | null>(null);
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        null
    );

    // Verification state
    const [isValidating, setIsValidating] = React.useState(false);
    const [isVerifyingEmails, setIsVerifyingEmails] = React.useState(false);
    const [emailVerificationResults, setEmailVerificationResults] = React.useState<Record<number, any>>({});
    const [validationResults, setValidationResults] = React.useState<Record<number, boolean | null>>({});

    // Dirty state tracking
    const [isConfigDirty, setIsConfigDirty] = React.useState(false);

    // Computed values
    const fields = React.useMemo(
        () => (attendeeData.length > 0 ? Object.keys(attendeeData[0]) : []),
        [attendeeData]
    );

    const selectedEvent = React.useMemo(
        () => events.find((e) => String(e.id) === String(selectedEventId)) || null,
        [events, selectedEventId]
    );

    // Fetch attendees when event changes
    React.useEffect(() => {
        if (!selectedEventId) {
            setAttendeeData([]);
            setFirstNameField('');
            setLastNameField('');
            setEmailField('');
            setSelectedSampleIndex(null);
            return;
        }

        setIsLoadingAttendees(true);
        fetch(`/email-distributor/attendees/${selectedEventId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'application/json',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && Array.isArray(data.rows) && data.rows.length > 0) {
                    const headers = data.rows[0];
                    const dataRows = data.rows.slice(1);
                    const attendees = dataRows.map((row: any[]) => {
                        const obj: any = {};
                        headers.forEach((header: string, idx: number) => {
                            obj[header] = row[idx] ?? '';
                        });
                        return obj;
                    });

                    setAttendeeData(attendees);

                    // Auto-map fields
                    setFirstNameField(
                        headers.find((f: string) =>
                            f.toLowerCase().includes('first')
                        ) ||
                        headers[0] ||
                        ''
                    );
                    setLastNameField(
                        headers.find((f: string) =>
                            f.toLowerCase().includes('last')
                        ) ||
                        headers[1] ||
                        ''
                    );
                    setEmailField(
                        headers.find((f: string) =>
                            f.toLowerCase().includes('email')
                        ) ||
                        headers[2] ||
                        ''
                    );
                    setSelectedSampleIndex(0);
                } else {
                    setAttendeeData([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching attendees:', error);
                setAttendeeData([]);
            })
            .finally(() => {
                setIsLoadingAttendees(false);
            });
    }, [selectedEventId]);

    // Mark config as dirty when relevant fields change
    React.useEffect(() => {
        setIsConfigDirty(true);
    }, [
        subject,
        editorContent,
        firstNameField,
        lastNameField,
        emailField,
        selectedTemplateId,
        selectedSampleIndex,
    ]);

    // Generate email preview
    const generatePreview = React.useCallback(() => {
        const selectedTemplate = templates.find(
            (t) => t.id === selectedTemplateId
        );

        const buildEmailHtml = (innerHtml: string) => {
            if (selectedTemplate) {
                let tmpl = selectedTemplate.html_content || '';
                tmpl = tmpl.replace(/\\n/g, '<br />').replace(/\\r/g, '');

                if (selectedEvent) {
                    tmpl = tmpl.replace(/{{event_name}}/g, selectedEvent.name || '');
                    const date = selectedEvent.start_date || selectedEvent.event_date;
                    tmpl = tmpl.replace(
                        /{{event_date}}/g,
                        date ? new Date(date).toLocaleDateString() : ''
                    );
                }

                return tmpl.replace('{{body}}', innerHtml);
            }
            return innerHtml;
        };

        const generated = attendeeData.map((row) => {
            let personalizedBody = editorContent;

            fields.forEach((field) => {
                const placeholder = `{{${field}}}`;
                const value = String(row[field] ?? '');
                personalizedBody = personalizedBody.replaceAll(
                    placeholder,
                    value
                );
            });

            if (selectedEvent) {
                personalizedBody = personalizedBody.replaceAll(
                    '{{event_name}}',
                    selectedEvent.name || ''
                );
                const date = selectedEvent.start_date || selectedEvent.event_date;
                personalizedBody = personalizedBody.replaceAll(
                    '{{event_date}}',
                    date ? new Date(date).toLocaleDateString() : ''
                );
            }

            // Convert newlines to <br /> for HTML preview and email
            const htmlBody = personalizedBody.replaceAll('\n', '<br />');

            return {
                first_name: String(row[firstNameField] ?? ''),
                last_name: String(row[lastNameField] ?? ''),
                email: String(row[emailField] ?? ''),
                event_id: selectedEventId,
                event_name: selectedEvent?.name || null,
                event_date: selectedEvent?.start_date || selectedEvent?.event_date || null,
                subject,
                body: buildEmailHtml(htmlBody),
            };
        });

        setGeneratedEmails(generated);
        setIsConfigDirty(false);
    }, [
        attendeeData,
        editorContent,
        fields,
        firstNameField,
        lastNameField,
        emailField,
        selectedEventId,
        selectedEvent,
        subject,
        templates,
        selectedTemplateId,
    ]);

    // Distribute emails
    const distribute = React.useCallback(async () => {
        if (!generatedEmails || generatedEmails.length === 0) return;

        setIsDistributing(true);
        setDistributionError(null);

        try {
            const response = await axios.post('/distribution/distribute', {
                recipients: generatedEmails,
            });

            if (response.data.queued) {
                setSuccessMessage(
                    `Distribution started! Sent ${response.data.sent_count} emails.`
                );
                setGeneratedEmails(null);
                setDialogOpen(false);
            }
        } catch (error: any) {
            let title = 'Distribution Failed';
            let messages: string[] = [];

            if (error.response?.status === 422) {
                title = 'Validation Error';
                const errors = error.response.data?.errors || {};
                messages = Object.values(errors).flat() as string[];
            } else if (error.response?.status === 419) {
                title = 'Session Expired';
                messages = ['Please refresh the page and try again.'];
            } else {
                messages = [error.message || 'Failed to start distribution.'];
            }

            setDistributionError({ title, messages });
            setDialogOpen(true);
        } finally {
            setIsDistributing(false);
        }
    }, [generatedEmails]);

    // Verification methods
    const validatePurchases = React.useCallback(async () => {
        if (!selectedEventId) return;
        setIsValidating(true);
        try {
            const res = await axios.post(`/sellables/events/${selectedEventId}/attendees/validate-purchases`);
            setSuccessMessage(`Validated ${res.data.total_checked} entries. ${res.data.valid_count} valid.`);
            // Results are stored in the spreadsheet, we might need to refresh data or manage local state
            // For distributor, we mainly care about the feedback
        } catch (e: any) {
            setDistributionError({
                title: 'Validation Failed',
                messages: [e.response?.data?.error || e.message]
            });
            setDialogOpen(true);
        } finally {
            setIsValidating(false);
        }
    }, [selectedEventId]);

    const verifyEmails = React.useCallback(async () => {
        if (!selectedEventId) return;
        setIsVerifyingEmails(true);
        setEmailVerificationResults({});
        try {
            const res = await axios.post(`/sellables/events/${selectedEventId}/attendees/verify-emails`);
            setSuccessMessage(`Checked ${res.data.total_checked} emails. ${res.data.valid_count} valid.`);
            if (res.data.results) {
                setEmailVerificationResults(res.data.results);
            }
        } catch (e: any) {
            setDistributionError({
                title: 'Verification Failed',
                messages: [e.response?.data?.error || e.message]
            });
            setDialogOpen(true);
        } finally {
            setIsVerifyingEmails(false);
        }
    }, [selectedEventId]);

    // Auto-clear success message
    React.useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(null), 4500);
        return () => clearTimeout(timer);
    }, [successMessage]);

    return {
        // Event & template selection
        selectedEventId,
        setSelectedEventId,
        selectedEvent,
        selectedTemplateId,
        setSelectedTemplateId,

        // Attendee data
        attendeeData,
        isLoadingAttendees,
        fields,

        // Field mapping
        firstNameField,
        setFirstNameField,
        lastNameField,
        setLastNameField,
        emailField,
        setEmailField,

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
        hasSpreadsheetConfigured: Boolean(selectedEvent?.google_spreadsheet_id && selectedEvent?.google_sheet_name),
        successMessage,

        // Verification
        isValidating,
        isVerifyingEmails,
        emailVerificationResults,
        validationResults,
        validatePurchases,
        verifyEmails,
    };
}
