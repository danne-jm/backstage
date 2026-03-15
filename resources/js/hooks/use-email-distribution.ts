import * as React from 'react';
import axios from 'axios';

/**
 * Hook for managing email distribution state and logic
 * Encapsulates all the complex state management
 */
interface UseEmailDistributionProps {
    events: any[];
    templates: any[];
}

export function useEmailDistribution({
    events,
    templates,
}: UseEmailDistributionProps) {
    // Permission check disabled - handled later
    const canSend = true;

    // Event and template selection
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
        null
    );
    const [selectedTemplateId, setSelectedTemplateId] = React.useState<
        string | 'none'
    >('none');

    // Attendee data
    const [attendeeData, setAttendeeData] = React.useState<any[]>([]);
    const [allAttendeeData, setAllAttendeeData] = React.useState<any[]>([]);
    const [isLoadingAttendees, setIsLoadingAttendees] = React.useState(false);
    const [isFiltered, setIsFiltered] = React.useState(false);

    // Field mapping
    const [firstNameField, setFirstNameField] = React.useState('');
    const [lastNameField, setLastNameField] = React.useState('');
    const [emailField, setEmailField] = React.useState('');

    // Mail mode: normal | qr
    const [mailMode, setMailMode] = React.useState<'normal' | 'qr'>('normal');

    // Nullable / skippable fields
    const [nullableFields, setNullableFields] = React.useState<Record<string, boolean>>({});

    // Email composition
    const [subject, setSubject] = React.useState('Your ticket information');
    const [editorContent, setEditorContent] = React.useState('<p style="margin:0;">Hello <strong>{{firstName}}</strong> <strong>{{last_name}}</strong>,</p>\n<p style="margin:0;">Thanks for registering — below are your ticket details for the event.</p><ul style="margin:0; padding-left:20px; list-style-type:disc;">\n<li style="margin:0; padding:0; display:list-item;">Event: {{event_name}}</li>\n<li style="margin:0; padding:0; display:list-item;">Date: {{event_date}}</li>\n<li style="margin:0; padding:0; display:list-item;">Bring: Your ESN card (if applicable)</li>\n</ul><p style="margin:0;">Please bring a copy of this email (printed or on your phone).</p>\n<p style="margin:0;">See you there,<br/>ESN Leuven</p>');

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

    // Dirty state tracking - computed from email generation
    const [lastGeneratedContent, setLastGeneratedContent] = React.useState<string>('');

    // Check if config is dirty by comparing current state to last generated
    const isConfigDirty = React.useMemo(() => {
        // Create a hash of the current configuration
        const currentConfigHash = JSON.stringify({
            editorContent,
            subject,
            firstNameField,
            lastNameField,
            emailField,
            selectedTemplateId,
            mailMode,
            nullableFields,
        });
        
        // If nothing generated yet, it's not dirty (it's empty)
        if (!generatedEmails || generatedEmails.length === 0) {
            return false;
        }
        
        // If current config differs from last generated, it's dirty
        return currentConfigHash !== lastGeneratedContent;
    }, [editorContent, subject, firstNameField, lastNameField, emailField, selectedTemplateId, mailMode, nullableFields, generatedEmails, lastGeneratedContent]);

    // Computed values
    const fields = React.useMemo(
        () => (attendeeData.length > 0 ? Object.keys(attendeeData[0]) : []),
        [attendeeData]
    );

    const selectedEvent = React.useMemo(
        () => events.find((e) => String(e.id) === String(selectedEventId)) || null,
        [events, selectedEventId]
    );

    // Keep nullableFields in sync with available fields
    React.useEffect(() => {
        setNullableFields((prev) => {
            const next: Record<string, boolean> = {};
            fields.forEach((f) => {
                next[f] = prev[f] ?? false;
            });
            return next;
        });
    }, [fields]);

    // Auto-insert/remove {{qr}} when switching mail mode
    React.useEffect(() => {
        const qrPlaceholder = '{{qr}}';
        
        if (mailMode === 'qr') {
            // Add QR placeholder if not already present
            setEditorContent((prev) => {
                if (prev.includes(qrPlaceholder)) return prev;
                // Append inside a new paragraph
                if (prev.trim().endsWith('</p>')) {
                    return prev + `<span style="display:block;margin:0;">${qrPlaceholder}</span>`;
                }
                return prev + `<p style="margin:0;">${qrPlaceholder}</p>`;
            });
        } else {
            // Remove QR placeholder when switching to normal mode
            setEditorContent((prev) => {
                // Remove all instances of {{qr}}
                return prev.replaceAll(qrPlaceholder, '').replaceAll(/<span[^>]*style="display:block;margin:0;"><\/span>/g, '').replaceAll(/<p[^>]*style="margin:0;"><\/p>/g, '');
            });
        }
    }, [mailMode]);

    // Fetch attendees when event changes
    React.useEffect(() => {
        if (!selectedEventId) {
            setAttendeeData([]);
            setAllAttendeeData([]);
            setFirstNameField('');
            setLastNameField('');
            setEmailField('');
            setSelectedSampleIndex(null);
            setIsFiltered(false);
            return;
        }

        setIsLoadingAttendees(true);
        
        // Fetch both filtered and unfiltered data in parallel
        Promise.all([
            fetch(`/email-distributor/attendees/${selectedEventId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            }).then(res => res.json()),
            fetch(`/email-distributor/attendees-all/${selectedEventId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            }).then(res => res.json())
        ])
            .then(([filteredData, unfilteredData]) => {
                // Process filtered data
                if (filteredData.success && Array.isArray(filteredData.rows) && filteredData.rows.length > 0) {
                    const headers = filteredData.rows[0];
                    const dataRows = filteredData.rows.slice(1);
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

                // Process unfiltered data to check if filtering is active
                if (unfilteredData.success && Array.isArray(unfilteredData.rows) && unfilteredData.rows.length > 0) {
                    setAllAttendeeData(
                        unfilteredData.rows.slice(1).map((row: any[]) => {
                            const headers = unfilteredData.rows[0];
                            const obj: any = {};
                            headers.forEach((header: string, idx: number) => {
                                obj[header] = row[idx] ?? '';
                            });
                            return obj;
                        })
                    );
                    
                    // Check if filtering is active by comparing counts
                    const filteredCount = filteredData.success && Array.isArray(filteredData.rows) ? filteredData.rows.length - 1 : 0;
                    const unfilteredCount = unfilteredData.rows.length - 1;
                    setIsFiltered(filteredCount < unfilteredCount);
                }
            })
            .catch((error) => {
                console.error('Error fetching attendees:', error);
                setAttendeeData([]);
                setAllAttendeeData([]);
                setIsFiltered(false);
            })
            .finally(() => {
                setIsLoadingAttendees(false);
            });
    }, [selectedEventId]);

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
                const rawValue = row[field];

                let value: string;
                if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
                    // If the field is NOT skippable, show "undefined" to alert the user
                    value = nullableFields[field] ? '' : 'undefined';
                } else {
                    value = String(rawValue);
                }

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
                const rawDate = selectedEvent.start_date || selectedEvent.event_date;
                const formattedEventDate = rawDate
                    ? new Date(rawDate).toLocaleDateString()
                    : '';
                personalizedBody = personalizedBody.replaceAll(
                    '{{event_date}}',
                    formattedEventDate
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
        // Mark this configuration as generated
        setLastGeneratedContent(JSON.stringify({
            editorContent,
            subject,
            firstNameField,
            lastNameField,
            emailField,
            selectedTemplateId,
            mailMode,
            nullableFields,
        }));
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
        allAttendeeData,
        isLoadingAttendees,
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
