import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { ticketing } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { toDataURL } from 'qrcode';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ticketing System',
        href: ticketing().url,
    },
];

export default function Ticketing() {
    const props = usePage<SharedData & { templates: any[] }>().props;
    const events: any[] = Array.isArray(props['events']) ? props['events'] : [];
    const templates: any[] = Array.isArray(props['templates']) ? props['templates'] : [];

    // State to hold the attendee data fetched from the backend
    const [sampleData, setSampleData] = React.useState<any[]>([]);

    // Template State
    const [selectedTemplateId, setSelectedTemplateId] = React.useState<number | 'none'>('none');

    const fields = React.useMemo(
        () => (sampleData.length ? Object.keys(sampleData[0]) : []),
        [sampleData],
    );

    // Mapping dropdowns
    const [firstNameField, setFirstNameField] = React.useState<string>('');
    const [lastNameField, setLastNameField] = React.useState<string>('');
    const [emailField, setEmailField] = React.useState<string>('');

    // Mail information (normal | qr embedding)
    const [mailMode, setMailMode] = React.useState<'normal' | 'qr'>('normal');
    // Note: event name/date for QR will be taken from the selected event automatically
    const [nullableFields, setNullableFields] = React.useState<
        Record<string, boolean>
    >(() => {
        const m: Record<string, boolean> = {};
        fields.forEach((f) => {
            m[f] = false;
        });
        return m;
    });

    // keep nullableFields in sync if sample columns change
    React.useEffect(() => {
        setNullableFields((prev) => {
            const next: Record<string, boolean> = {};
            fields.forEach((f) => {
                next[f] = prev[f] ?? false;
            });
            return next;
        });
    }, [fields]);

    // Email composition
    const [subject, setSubject] = React.useState<string>(
        'Your ticket information',
    );
    const bodyRef = React.useRef<HTMLDivElement | null>(null);

    // Selected event id — default to none so the placeholder shows
    const [selectedEvent, setSelectedEvent] = React.useState<number | null>(
        null,
    );

    // Fetch attendees from backend when event changes
    React.useEffect(() => {
        if (!selectedEvent) {
            // Clear data when no event is selected
            setSampleData([]);
            setFirstNameField('');
            setLastNameField('');
            setEmailField('');
            setSelectedSampleIndex(null);
            return;
        }

        // Fetch attendees for the selected event
        fetch(`/ticketing/attendees/${selectedEvent}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success && Array.isArray(data.attendees)) {
                    setSampleData(data.attendees);
                    // Set default field mappings when data is loaded
                    if (data.attendees.length > 0) {
                        const firstAttendee = data.attendees[0];
                        const availableFields = Object.keys(firstAttendee);
                        
                        setFirstNameField(availableFields.find(f => f === 'first_name') || availableFields[0] || '');
                        setLastNameField(availableFields.find(f => f === 'last_name') || availableFields[1] || '');
                        setEmailField(availableFields.find(f => f === 'email') || availableFields[2] || '');
                        setSelectedSampleIndex(0);
                    }
                } else {
                    console.error('Failed to fetch attendees:', data.message);
                    setSampleData([]);
                }
            })
            .catch((error) => {
                console.error('Error fetching attendees:', error);
                setSampleData([]);
            });
    }, [selectedEvent]);

    // Preview / generated payload
    const [generated, setGenerated] = React.useState<any[] | null>(null);
    const [showRendered, setShowRendered] = React.useState(true);
    const [selectedSampleIndex, setSelectedSampleIndex] = React.useState<
        number | null
    >(0);

    // Default email template (initial editor content)
    const defaultBodyTemplate = React.useMemo(() => {
        const qrHint =
            mailMode === 'qr'
                ? '<p>Your QR code for the event:</p><p>{{qr}}</p>'
                : '';
        return `
            <p>Hello <strong>{{${firstNameField}}}</strong>,</p>
            <p>Thanks for registering — below are your ticket details for the event.</p>
            ${qrHint}
            <ul>
                <li><strong>Event:</strong> {{event_name}}</li>
                <li><strong>Date:</strong> {{event_date}}</li>
                <li><strong>Bring:</strong> Your ESN card (if applicable)</li>
            </ul>
            <p>Please bring a copy of this email (printed or on your phone).</p>
            <p>See you there,<br/>ESN Leuven</p>
        `;
    }, [firstNameField, mailMode]);

    // initialize editor with default template if empty
    React.useEffect(() => {
        if (
            bodyRef.current &&
            (!bodyRef.current.innerHTML ||
                bodyRef.current.innerHTML.trim() === '')
        ) {
            bodyRef.current.innerHTML = defaultBodyTemplate;
        }
    }, [bodyRef, defaultBodyTemplate]);

    const applyFormat = (cmd: string, value?: string) => {
        try {
            bodyRef.current?.focus();
            document.execCommand(cmd, false, value);
        } catch (e) {
            console.warn('Formatting not supported', e);
        }
    };

    const insertBulletList = () => {
        applyFormat('insertUnorderedList');
    };

    const insertLink = () => {
        const url = prompt('Enter the URL for the link:');
        if (!url) return;
        bodyRef.current?.focus();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);

            // Only operate inside the editor
            if (
                bodyRef.current &&
                bodyRef.current.contains(range.commonAncestorContainer)
            ) {
                try {
                    // Try native command first
                    const success = document.execCommand(
                        'createLink',
                        false,
                        url,
                    );

                    // If execCommand didn't create a link (or to ensure attributes), fallback to manual insertion
                    setTimeout(() => {
                        if (!bodyRef.current) return;

                        // If execCommand created a link, ensure attributes are set
                        const links = bodyRef.current.querySelectorAll('a');
                        links.forEach((a) => {
                            a.setAttribute('target', '_blank');
                            a.setAttribute('rel', 'noopener noreferrer');
                        });

                        // If execCommand returned false or selection wasn't wrapped, create link manually
                        const hasLinkInSelection = Array.from(links).some(
                            (a) => {
                                try {
                                    return sel.getRangeAt(0).intersectsNode(a);
                                } catch (e) {
                                    return false;
                                }
                            },
                        );

                        if (!hasLinkInSelection && !range.collapsed) {
                            try {
                                const contents = range.extractContents();
                                const a = document.createElement('a');
                                a.href = url;
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.appendChild(contents);
                                range.insertNode(a);

                                // Collapse selection after the inserted link
                                sel.removeAllRanges();
                                const newRange = document.createRange();
                                newRange.setStartAfter(a);
                                newRange.collapse(true);
                                sel.addRange(newRange);
                            } catch (e) {
                                // Last-resort manual insertion: replace selection text with a link node
                                const a = document.createElement('a');
                                a.href = url;
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                a.textContent = sel.toString();
                                range.deleteContents();
                                range.insertNode(a);
                                sel.removeAllRanges();
                            }
                        }
                    }, 0);
                } catch (e) {
                    // If execCommand throws, fallback to manual link creation
                    try {
                        const contents = range.extractContents();
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.appendChild(contents);
                        range.insertNode(a);
                        sel.removeAllRanges();
                        const newRange = document.createRange();
                        newRange.setStartAfter(a);
                        newRange.collapse(true);
                        sel.addRange(newRange);
                    } catch (ex) {
                        // fallback: append a link at the end
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.textContent = url;
                        bodyRef.current.appendChild(a);
                    }
                }
                return;
            }
        }

        // No selection or outside editor: append link at end
        if (bodyRef.current) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = url;
            bodyRef.current.appendChild(a);
        }
    };

    const removeLink = () => {
        applyFormat('unlink');
    };

    const setTextColor = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.click();
        input.oninput = () => {
            applyFormat('foreColor', input.value);
            document.body.removeChild(input);
        };
        input.onblur = () => {
            document.body.removeChild(input);
        };
    };

    const setBgColor = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.click();
        input.oninput = () => {
            applyFormat('hiliteColor', input.value);
            document.body.removeChild(input);
        };
        input.onblur = () => {
            document.body.removeChild(input);
        };
    };

    const generateTickets = () => {
        const bodyHtml = bodyRef.current ? bodyRef.current.innerHTML : '';
        const eventObj = events.find((ev: any) => ev.id === selectedEvent) ?? null;
        const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId));

        const buildEmailHtml = (innerHtml: string, ev: any | null) => {
            // Use Template from DB if selected
            if (selectedTemplate) {
                let tmpl = selectedTemplate.html_content;
                // Replace template-level variables
                const eventTitle = ev ? ev.name : '';
                const eventDate = ev && ev.event_date ? new Date(ev.event_date).toLocaleDateString() : '';
                tmpl = tmpl.replace('{{event_name}}', eventTitle);
                tmpl = tmpl.replace('{{event_date}}', eventDate);
                // Inject the user content into {{body}}
                return tmpl.replace('{{body}}', innerHtml);
            }
            // "No Template" -> Basic blank email
            return innerHtml;
        };

        const out = sampleData.map((row) => {
            let personalizedBody = bodyHtml;
            fields.forEach((field) => {
                const placeholder = `{{${field}}}`;
                const value = String((row as any)[field] ?? '');
                personalizedBody = personalizedBody.replaceAll(placeholder, value);
            });
            // Note: We leave {{qr}} intact here so the backend can find it.
            // The frontend preview (below) will handle mocking it.
            if (eventObj) {
                personalizedBody = personalizedBody.replaceAll('{{event_name}}', eventObj.name || '');
                // ... date replacement ...
            }
            return {
                first_name: String((row as any)[firstNameField] ?? ''),
                last_name: String((row as any)[lastNameField] ?? ''),
                email: String((row as any)[emailField] ?? ''),
                event_id: selectedEvent,
                event_name: eventObj ? eventObj.name : null,
                event_date: eventObj ? eventObj.event_date : null,
                subject,
                body: buildEmailHtml(personalizedBody, eventObj),
            };
        });
        setGenerated(out);
    };

    const [sending, setSending] = React.useState<boolean>(false);
    const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);

    // Helper to read a cookie value
    const getCookie = (name: string): string | null => {
        const match = document.cookie
            .split('; ')
            .find((row) => row.startsWith(name + '='));
        return match ? (match.split('=')[1] ?? null) : null;
    };

    const sendDistribution = async () => {
        // Ensure we have a generated payload, especially for QR codes
        if (!generated || mailMode === 'qr') {
            await generateTickets();
        }

        const payload = generated ?? [];

        if (!payload.length) {
            window.alert(
                'No recipients found to distribute to. Generate preview first.',
            );
            return;
        }

        // Open the nicer confirmation modal
        setConfirmOpen(true);
    };

    const proceedSendDistribution = async () => {
        // Called when user confirms in the modal
        setConfirmOpen(false);
        setSending(true);

        try {
            const xsrfCookie = getCookie('XSRF-TOKEN');

            const resp = await fetch('/distribute-emails', {
                method: 'POST',
                credentials: 'same-origin', // ensure cookies (session/XSRF) are sent
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': xsrfCookie ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ recipients: generated ?? [] }),
            });

            if (resp.status === 419) {
                let json = {} as any;
                try {
                    json = await resp.json();
                } catch (_) {
                    /* ignore */
                }
                throw new Error(
                    `CSRF token mismatch (419). ${json.message ?? ''} Please refresh the page and try again.`,
                );
            }

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Server error: ${resp.status} ${txt}`);
            }

            const data = await resp.json();
        } catch (e: any) {
            console.error(e);
            window.alert('Distribution failed: ' + (e.message ?? String(e)));
        } finally {
            setSending(false);
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ticketing System" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-3 md:col-span-2">
                        <div>
                            <Label>Subject</Label>
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Message</Label>
                            <div className="mb-2 flex flex-wrap items-center gap-2 justify-between">
                                <div className="flex gap-2">
                                    <Button onClick={() => applyFormat('bold')} size="sm" variant="outline" aria-label="Bold">B</Button>
                                    <Button onClick={() => applyFormat('italic')} size="sm" variant="outline" aria-label="Italic">I</Button>
                                    <Button onClick={() => applyFormat('underline')} size="sm" variant="outline" aria-label="Underline">U</Button>
                                    <Button onClick={insertBulletList} size="sm" variant="outline" aria-label="Insert list">•</Button>
                                    <Button onClick={insertLink} size="sm" variant="outline" aria-label="Insert link">🔗</Button>
                                    <Button onClick={removeLink} size="sm" variant="outline" aria-label="Remove link">⛔</Button>
                                    <Button onClick={setTextColor} size="sm" variant="outline" aria-label="Text color" style={{ color: '#d97706' }}>A</Button>
                                    <Button onClick={setBgColor} size="sm" variant="outline" aria-label="Background color" style={{ background: '#fde68a', color: '#222' }}>Bg</Button>
                                </div>
                                {/* Template Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Email Template:</span>
                                    <select
                                        className="h-8 w-[160px] rounded border text-xs"
                                        value={selectedTemplateId}
                                        onChange={(e) => setSelectedTemplateId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
                                    >
                                        <option value="none" className=''>No Template</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div
                                ref={bodyRef}
                                contentEditable
                                suppressContentEditableWarning
                                className="min-h-[180px] w-full rounded-md border bg-black p-3 text-sm text-foreground"
                                style={{ overflowY: 'auto' }}
                            >
                                {/* ... editor ... */}
                            </div>
                        </div>

                        {/* Responsive event/sample selector and event info section */}
                        <div className="mt-4 flex flex-wrap items-end gap-4 md:gap-6">
                            <div className="mt-2 flex max-w-[320px] min-w-[220px] flex-1 flex-col space-y-2">
                                <div>
                                    <Label htmlFor="event-select">Event</Label>
                                    <select
                                        id="event-select"
                                        value={String(selectedEvent ?? '')}
                                        onChange={(e) =>
                                            setSelectedEvent(
                                                Number(e.target.value) || null,
                                            )
                                        }
                                        className="w-full max-w-full min-w-[180px] rounded-md border p-2"
                                    >
                                        <option value="">
                                            -- Select event --
                                        </option>
                                        {events.length === 0 ? (
                                            <option value="">
                                                No events available
                                            </option>
                                        ) : (
                                            events.map((ev: any) => (
                                                <option
                                                    key={ev.id}
                                                    value={ev.id}
                                                >
                                                    {ev.name}{' '}
                                                    {ev.event_date
                                                        ? `(${new Date(ev.event_date).toLocaleDateString()})`
                                                        : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-2 flex max-w-[320px] min-w-[220px] flex-1 flex-col space-y-2">
                                <div>
                                    <Label htmlFor="sample-user-select">
                                        Sample user
                                    </Label>
                                    <select
                                        id="sample-user-select"
                                        value={String(
                                            selectedSampleIndex ?? '',
                                        )}
                                        onChange={(e) =>
                                            setSelectedSampleIndex(
                                                e.target.value === ''
                                                    ? null
                                                    : Number(e.target.value),
                                            )
                                        }
                                        className="w-full max-w-full min-w-[180px] rounded-md border p-2 text-sm"
                                    >
                                        {sampleData.map((s, i) => (
                                            <option key={i} value={i}>
                                                {s.first_name} {s.last_name} —{' '}
                                                {s.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end">
                                <div className="flex gap-2">
                                    <Button
                                        onClick={generateTickets}
                                        className="w-full md:w-auto"
                                    >
                                        Generate Preview
                                    </Button>
                                    <Button
                                        onClick={sendDistribution}
                                        className="w-full md:w-auto"
                                        disabled={sending}
                                        variant="destructive"
                                    >
                                        {sending
                                            ? 'Sending…'
                                            : 'Distribute (real)'}
                                    </Button>
                                </div>
                                {/* Confirmation dialog for distribution */}
                                <Dialog
                                    open={confirmOpen}
                                    onOpenChange={setConfirmOpen}
                                >
                                    <DialogContent className="max-h-[80vh] !w-[95vw] !max-w-md p-4">
                                        <DialogTitle>
                                            Confirm distribution
                                        </DialogTitle>
                                        <DialogDescription>
                                            You are about to distribute the
                                            prepared email to{' '}
                                            <strong>
                                                {(generated ?? []).length}
                                            </strong>{' '}
                                            recipients. This will enqueue
                                            background jobs to send the
                                            messages. Do you want to proceed?
                                        </DialogDescription>

                                        <div className="mt-4 text-xs text-muted-foreground">
                                            Queued sending is recommended for
                                            large recipient lists and will run
                                            in the background (run{' '}
                                            <code>php artisan queue:work</code>{' '}
                                            to process).
                                        </div>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="ghost">
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                onClick={
                                                    proceedSendDistribution
                                                }
                                                className="ml-2"
                                            >
                                                Confirm & Queue
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Event details area (always rendered below selectors) */}
                            <div className="mt-4 w-full basis-full">
                                {(() => {
                                    if (selectedEvent === null) {
                                        return (
                                            <div className="text-sm text-muted-foreground">
                                                No event selected
                                            </div>
                                        );
                                    }
                                    const ev =
                                        events.find(
                                            (x: any) => x.id === selectedEvent,
                                        ) ?? null;
                                    if (!ev)
                                        return (
                                            <div className="text-sm text-muted-foreground">
                                                Event not found
                                            </div>
                                        );

                                    const rows: Array<{
                                        label: string;
                                        value: string;
                                    }> = [];
                                    if (ev.name)
                                        rows.push({
                                            label: 'Name',
                                            value: String(ev.name),
                                        });
                                    if (ev.event_date)
                                        rows.push({
                                            label: 'Event date',
                                            value: new Date(
                                                ev.event_date,
                                            ).toLocaleString(),
                                        });
                                    if (ev.start_sell_date)
                                        rows.push({
                                            label: 'Start selling',
                                            value: new Date(
                                                ev.start_sell_date,
                                            ).toLocaleString(),
                                        });
                                    if (ev.end_sell_date)
                                        rows.push({
                                            label: 'End selling',
                                            value: new Date(
                                                ev.end_sell_date,
                                            ).toLocaleString(),
                                        });
                                    if (ev.price_with_card !== undefined)
                                        rows.push({
                                            label: 'Price (with ESN card)',
                                            value: `€${Number(ev.price_with_card).toFixed(2)}`,
                                        });
                                    if (ev.price_without_card !== undefined)
                                        rows.push({
                                            label: 'Price (without ESN card)',
                                            value: `€${Number(ev.price_without_card).toFixed(2)}`,
                                        });
                                    if (ev.variable_amount)
                                        rows.push({
                                            label: 'Variable amount',
                                            value: ev.variable_amount
                                                ? 'Yes'
                                                : 'No',
                                        });
                                    if (
                                        ev.quantity !== undefined &&
                                        ev.quantity !== null
                                    )
                                        rows.push({
                                            label: 'Quantity',
                                            value: String(ev.quantity),
                                        });
                                    if (
                                        ev.quantity_with_card !== undefined &&
                                        ev.quantity_with_card !== null
                                    )
                                        rows.push({
                                            label: 'Quantity (with card)',
                                            value: String(
                                                ev.quantity_with_card,
                                            ),
                                        });
                                    if (
                                        ev.quantity_without_card !==
                                            undefined &&
                                        ev.quantity_without_card !== null
                                    )
                                        rows.push({
                                            label: 'Quantity (without card)',
                                            value: String(
                                                ev.quantity_without_card,
                                            ),
                                        });
                                    if (ev.responsibleUser)
                                        rows.push({
                                            label: 'Responsible',
                                            value: `${ev.responsibleUser.first_name} ${ev.responsibleUser.last_name}`,
                                        });
                                    if (ev.notes)
                                        rows.push({
                                            label: 'Notes',
                                            value: String(ev.notes),
                                        });

                                    return (
                                        <div className="mt-2 w-full max-w-xl rounded bg-muted/40 p-3 text-sm">
                                            <Label className="mb-1">
                                                Event details
                                            </Label>
                                            <ul className="list-disc pl-5 text-sm">
                                                {rows.map((r) => (
                                                    <li key={r.label}>
                                                        <strong>
                                                            {r.label}:
                                                        </strong>{' '}
                                                        {r.value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    <aside className="">
                        <div>
                            <h4 className="text-sm font-semibold">
                                Field Mapping
                            </h4>
                            <div className="mt-2 space-y-2">
                                <div>
                                    <Label>First name source</Label>
                                    <select
                                        value={firstNameField}
                                        onChange={(e) =>
                                            setFirstNameField(e.target.value)
                                        }
                                        className="w-full rounded-md border p-2"
                                    >
                                        <option value="">
                                            — No mapping available —
                                        </option>
                                        {fields.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>Last name source</Label>
                                    <select
                                        value={lastNameField}
                                        onChange={(e) =>
                                            setLastNameField(e.target.value)
                                        }
                                        className="w-full rounded-md border p-2"
                                    >
                                        <option value="">
                                            — No mapping available —
                                        </option>
                                        {fields.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>Email source</Label>
                                    <select
                                        value={emailField}
                                        onChange={(e) =>
                                            setEmailField(e.target.value)
                                        }
                                        className="w-full rounded-md border p-2"
                                    >
                                        <option value="">
                                            — No mapping available —
                                        </option>
                                        {fields.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Mail information section: choose normal mail or mail with QR embedding. If QR selected show event name/date inputs and per-column nullable radios */}
                            <div className="mt-10">
                                <h4 className="text-sm font-semibold">
                                    Mail information
                                </h4>
                                <div className="mt-2 space-y-3">
                                    <div>
                                        <Label>Mail type</Label>
                                        <div className="mt-1 flex gap-4">
                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="mailMode"
                                                    value="normal"
                                                    checked={
                                                        mailMode === 'normal'
                                                    }
                                                    onChange={() =>
                                                        setMailMode('normal')
                                                    }
                                                />
                                                <span className="ml-1">
                                                    Normal mail
                                                </span>
                                            </label>

                                            <label className="inline-flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="mailMode"
                                                    value="qr"
                                                    checked={mailMode === 'qr'}
                                                    onChange={() =>
                                                        setMailMode('qr')
                                                    }
                                                />
                                                <span className="ml-1">
                                                    Mail with QR embedding
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    {/* When Mail with QR embedding is selected we take event metadata from the chosen event.
                                        Use the {{qr}} placeholder anywhere in your message to place the QR image. */}
                                    {mailMode === 'qr' && (
                                        <div className="space-y-2 text-xs text-muted-foreground">
                                            <div>
                                                Event name and date will be taken directly from the selected event. No need to enter them here.
                                            </div>
                                            <div>
                                                Use <code>{'{{qr}}'}</code> in your message where you want the QR image to appear.
                                            </div>
                                        </div>
                                    )}

                                    {/* Column nullable controls — visible regardless of mail mode */}
                                    <div>
                                        <Label>
                                            Skippable columns: can undefined
                                            user values be gracefully skipped?
                                        </Label>
                                        <div className="mt-2 space-y-2 text-sm">
                                            {fields.map((f) => (
                                                <div
                                                    key={f}
                                                    className="flex items-center gap-4"
                                                >
                                                    <div className="w-36 text-xs text-muted-foreground">{`{{${f}}}`}</div>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`nullable-${f}`}
                                                            checked={
                                                                !nullableFields[
                                                                    f
                                                                ]
                                                            }
                                                            onChange={() =>
                                                                setNullableFields(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [f]: false,
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <span className="ml-1">
                                                            Required [appear as
                                                            "undefined"]
                                                        </span>
                                                    </label>

                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`nullable-${f}`}
                                                            checked={Boolean(
                                                                nullableFields[
                                                                    f
                                                                ],
                                                            )}
                                                            onChange={() =>
                                                                setNullableFields(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [f]: true,
                                                                    }),
                                                                )
                                                            }
                                                        />
                                                        <span className="ml-1">
                                                            Skippable
                                                        </span>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                    {' '}
                                    Data Source Preview...
                                </h4>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                            Manage
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="flex h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-4 sm:!max-w-[95vw]">
                                        <DialogTitle>
                                            Sample Data Source
                                        </DialogTitle>
                                        <DialogDescription>
                                            <div className="text-xs text-muted-foreground">
                                                Total entries:{' '}
                                                {sampleData.length}
                                            </div>
                                        </DialogDescription>

                                        {/* content area grows and allows internal panes to scroll independently */}
                                        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                                            <div className="grid h-full min-h-0 grid-cols-3 gap-4">
                                                {/* Full data table with vertical scroll */}
                                                <div className="col-span-2 min-h-0">
                                                    <div className="h-full max-h-[75vh] overflow-y-auto rounded border">
                                                        <table className="w-full table-fixed text-xs">
                                                            <thead>
                                                                <tr>
                                                                    {fields.map(
                                                                        (f) => (
                                                                            <th
                                                                                key={
                                                                                    f
                                                                                }
                                                                                className="sticky top-0 z-10 border-b bg-background/95 pr-2 text-left text-xs backdrop-blur-sm"
                                                                            >
                                                                                {
                                                                                    f
                                                                                }
                                                                            </th>
                                                                        ),
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sampleData.map(
                                                                    (
                                                                        r,
                                                                        idx,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="border-t"
                                                                        >
                                                                            {fields.map(
                                                                                (
                                                                                    f,
                                                                                ) => (
                                                                                    <td
                                                                                        key={
                                                                                            f
                                                                                        }
                                                                                        className="py-1 pr-2 align-top text-xs"
                                                                                    >
                                                                                        <span
                                                                                            className="inline-block w-full truncate"
                                                                                            title={String(
                                                                                                (
                                                                                                    r as any
                                                                                                )[
                                                                                                    f
                                                                                                ] ??
                                                                                                    '',
                                                                                            )}
                                                                                        >
                                                                                            {String(
                                                                                                (
                                                                                                    r as any
                                                                                                )[
                                                                                                    f
                                                                                                ] ??
                                                                                                    '',
                                                                                            )}
                                                                                        </span>
                                                                                    </td>
                                                                                ),
                                                                            )}
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Recipient summary with vertical scroll */}
                                                <div className="col-span-1 min-h-0">
                                                    <div className="flex h-full max-h-[75vh] flex-col overflow-y-auto rounded-md border bg-background p-4">
                                                        <div className="flex-shrink-0">
                                                            <h4 className="text-sm font-semibold">
                                                                Recipients
                                                                summary
                                                            </h4>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Summary of
                                                                destination
                                                                domains and
                                                                potential typos
                                                            </p>
                                                        </div>
                                                        <div className="mt-3">
                                                            {/* compute domain summary client-side from sampleData */}
                                                            {(() => {
                                                                const emails: string[] =
                                                                    sampleData
                                                                        .map(
                                                                            (
                                                                                s,
                                                                            ) =>
                                                                                String(
                                                                                    (
                                                                                        s as any
                                                                                    )
                                                                                        .email ??
                                                                                        '',
                                                                                ).trim(),
                                                                        )
                                                                        .filter(
                                                                            Boolean,
                                                                        );
                                                                const domains: string[] =
                                                                    emails.map(
                                                                        (e) =>
                                                                            e.includes(
                                                                                '@',
                                                                            )
                                                                                ? e
                                                                                      .split(
                                                                                          '@',
                                                                                      )[1]
                                                                                      .toLowerCase()
                                                                                : '',
                                                                    );
                                                                const domainCounts: Record<
                                                                    string,
                                                                    number
                                                                > = {};
                                                                domains.forEach(
                                                                    (d) => {
                                                                        if (d)
                                                                            domainCounts[
                                                                                d
                                                                            ] =
                                                                                (domainCounts[
                                                                                    d
                                                                                ] ||
                                                                                    0) +
                                                                                1;
                                                                    },
                                                                );

                                                                const knownDomains =
                                                                    [
                                                                        'gmail.com',
                                                                        'hotmail.com',
                                                                        'yahoo.com',
                                                                        'outlook.com',
                                                                        'live.com',
                                                                        'icloud.com',
                                                                        'student.kuleuven.be',
                                                                        'kuleuven.be',
                                                                        'hotmail.co.uk',
                                                                        'yahoo.co.uk',
                                                                        'protonmail.com',
                                                                        'telenet.be',
                                                                        'skynet.be',
                                                                        'ucll.be',
                                                                        'esnleuven.be',
                                                                        'example.com', // sample data
                                                                    ];

                                                                const domainEntries =
                                                                    Object.entries(
                                                                        domainCounts,
                                                                    ).sort(
                                                                        (
                                                                            a,
                                                                            b,
                                                                        ) =>
                                                                            b[1] -
                                                                            a[1],
                                                                    );
                                                                const suspicious =
                                                                    domainEntries.filter(
                                                                        ([d]) =>
                                                                            !knownDomains.includes(
                                                                                d,
                                                                            ),
                                                                    );

                                                                return (
                                                                    <div className="space-y-3 text-xs">
                                                                        <div>
                                                                            <div className="text-xs font-medium">
                                                                                Known
                                                                                domains
                                                                            </div>
                                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                                {knownDomains.join(
                                                                                    ', ',
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <div className="text-xs font-medium">
                                                                                Domain
                                                                                counts
                                                                            </div>
                                                                            <ul className="mt-1 list-disc pl-5">
                                                                                {domainEntries.length ===
                                                                                0 ? (
                                                                                    <li className="text-muted-foreground">
                                                                                        No
                                                                                        recipient
                                                                                        emails
                                                                                        found
                                                                                    </li>
                                                                                ) : (
                                                                                    domainEntries.map(
                                                                                        ([
                                                                                            d,
                                                                                            c,
                                                                                        ]) => (
                                                                                            <li
                                                                                                key={
                                                                                                    d
                                                                                                }
                                                                                                className={
                                                                                                    'flex items-center justify-between ' +
                                                                                                    (knownDomains.includes(
                                                                                                        d,
                                                                                                    )
                                                                                                        ? ''
                                                                                                        : 'text-red-600')
                                                                                                }
                                                                                            >
                                                                                                <span className="mr-2">
                                                                                                    {
                                                                                                        d
                                                                                                    }
                                                                                                </span>
                                                                                                <span className="text-muted-foreground">
                                                                                                    {
                                                                                                        c
                                                                                                    }
                                                                                                </span>
                                                                                            </li>
                                                                                        ),
                                                                                    )
                                                                                )}
                                                                            </ul>
                                                                        </div>

                                                                        {suspicious.length >
                                                                            0 && (
                                                                            <div>
                                                                                <div className="text-xs font-medium text-red-600">
                                                                                    Potential
                                                                                    typos
                                                                                </div>
                                                                                <div className="mt-1 text-xs">
                                                                                    {suspicious.map(
                                                                                        ([
                                                                                            d,
                                                                                        ]) => (
                                                                                            <div
                                                                                                key={
                                                                                                    d
                                                                                                }
                                                                                                className="mb-1"
                                                                                            >
                                                                                                <div className="font-medium">
                                                                                                    {
                                                                                                        d
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="text-muted-foreground">
                                                                                                    Addresses:
                                                                                                </div>
                                                                                                <ul className="mt-1 list-disc pl-5 text-xs">
                                                                                                    {emails
                                                                                                        .filter(
                                                                                                            (
                                                                                                                e,
                                                                                                            ) =>
                                                                                                                e.endsWith(
                                                                                                                    `@${d}`,
                                                                                                                ),
                                                                                                        )
                                                                                                        .slice(
                                                                                                            0,
                                                                                                            5,
                                                                                                        )
                                                                                                        .map(
                                                                                                            (
                                                                                                                e,
                                                                                                            ) => (
                                                                                                                <li
                                                                                                                    key={
                                                                                                                        e
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        e
                                                                                                                    }
                                                                                                                </li>
                                                                                                            ),
                                                                                                        )}
                                                                                                </ul>
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button>Close</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="mt-3 text-xs">
                                <table className="w-full table-fixed text-xs">
                                    <thead>
                                        <tr>
                                            <th className="w-[6.5rem] min-w-[6.5rem] pr-2 text-left">
                                                {firstNameField}
                                            </th>
                                            <th className="w-[6.5rem] min-w-[6.5rem] pr-2 text-left">
                                                {lastNameField}
                                            </th>
                                            <th className="pr-2 text-left">
                                                {emailField}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleData
                                            .slice(0, 10)
                                            .map((r, idx) => (
                                                <tr
                                                    key={idx}
                                                    className="border-t"
                                                >
                                                    <td className="py-1 pr-2">
                                                        <span
                                                            title={String(
                                                                (r as any)[
                                                                    firstNameField
                                                                ] ?? '',
                                                            )}
                                                            className="inline-block w-full truncate"
                                                        >
                                                            {String(
                                                                (r as any)[
                                                                    firstNameField
                                                                ] ?? '',
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-1 pr-2">
                                                        <span
                                                            title={String(
                                                                (r as any)[
                                                                    lastNameField
                                                                ] ?? '',
                                                            )}
                                                            className="inline-block w-full truncate"
                                                        >
                                                            {String(
                                                                (r as any)[
                                                                    lastNameField
                                                                ] ?? '',
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="py-1 pr-2">
                                                        <span
                                                            title={String(
                                                                (r as any)[
                                                                    emailField
                                                                ] ?? '',
                                                            )}
                                                            className="inline-block w-full truncate"
                                                        >
                                                            {String(
                                                                (r as any)[
                                                                    emailField
                                                                ] ?? '',
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </aside>
                </div>
                {/* Removed duplicate event details rendering */}
            </div>

            <div>
                <div className="px-4 pb-4">
                    <h4 className="text-sm font-semibold">Generated Payload Preview</h4>
                    <div className="pt-2">
                        <div className="mb-1 text-sm">Render format</div>
                        <div
                            role="tablist"
                            aria-orientation="horizontal"
                            className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={!showRendered}
                                onClick={() => setShowRendered(false)}
                                className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${!showRendered ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                            >
                                Json
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={showRendered}
                                onClick={() => setShowRendered(true)}
                                className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${showRendered ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                            >
                                HTML (Email Preview)
                            </button>
                        </div>
                    </div>
                    <div className="mt-2">
                        {generated ? (
                            <div>
                                {!showRendered && (
                                    <pre className="rounded bg-muted p-3 text-xs">
                                        {JSON.stringify(generated, null, 2)}
                                    </pre>
                                )}

                                {showRendered && (
                                    <div className="rounded border bg-white p-3">
                                        <h5 className="mb-2 text-sm font-medium">Rendered HTML Preview</h5>
                                        {selectedSampleIndex === null ? (
                                            <div className="text-sm text-muted-foreground">
                                                Select a sample user to preview rendered email.
                                            </div>
                                        ) : (
                                            <div
                                                className="prose max-w-none"
                                                dangerouslySetInnerHTML={{
                                                    __html: (() => {
                                                        const user = sampleData[selectedSampleIndex as number];
                                                        let html = generated[Number(selectedSampleIndex)]?.body ?? '';
                                                        // Mock QR code for preview
                                                        html = html.replace(
                                                            /{{qr}}/g, 
                                                            '<div style="background:#eee;border:2px dashed #999;width:150px;height:150px;display:flex;align-items:center;justify-content:center;margin:10px auto;">QR PREVIEW</div>'
                                                        );
                                                        // ... existing replacements ...
                                                        return html;
                                                    })(),
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                No preview generated yet. Click Generate Preview.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
