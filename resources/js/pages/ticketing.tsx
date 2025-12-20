import * as React from 'react';
import AppLayout from '@/layouts/app-layout';
import { ticketing } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ticketing System',
        href: ticketing().url,
    },
];

// Small sample dataset embedded in the page for quick testing / mapping


const sampleData = [

    { first_name: 'Daniel', last_name: 'Meyer', nationality: 'DE', esn_card: true, email: 'danieljaurell@gmail.com' },
    { first_name: 'Daniel', last_name: 'Mevo', nationality: 'DE', esn_card: true, email: 'danieljaurell@gmail.com' },
    { first_name: 'Daniel', last_name: 'Meyer', nationality: 'DE', esn_card: true, email: 'danieljaurell@gmail.com' },
    { first_name: 'Daniel', last_name: 'Ahmad', nationality: 'DE', esn_card: true, email: 'danieljaurell@gmail.com' },
    { first_name: 'Daniel', last_name: 'Meyer', nationality: 'DE', esn_card: true, email: 'danieljaurell@gmail.com' },
];
/*
const sampleData = [
    { first_name: 'Alice', last_name: 'Meyer', nationality: 'DE', esn_card: true, email: 'alice.meyer@example.com' },
    { first_name: 'Bob', last_name: 'Smith', nationality: 'UK', esn_card: false, email: 'bob.smith@gmail.com' },
    { first_name: 'Carlos', last_name: 'Garcia', nationality: 'ES', esn_card: true, email: 'carlos.garcia@esnleuven.be' },
    { first_name: 'Diana', last_name: 'Rossi', nationality: 'IT', esn_card: false, email: 'diana.rossi@kuleuven.be' },
    { first_name: 'Eva', last_name: 'Kowalski', nationality: 'PL', esn_card: true, email: 'eva.kowalski@student.kuleuven.be' },
    { first_name: 'Frank', last_name: 'Mueller', nationality: 'DE', esn_card: false, email: 'frank.mueller@hotmail.com' },
    { first_name: 'George', last_name: 'Brown', nationality: 'US', esn_card: true, email: 'george.brown@outlook.com' },
    { first_name: 'Hannah', last_name: 'Wilson', nationality: 'UK', esn_card: false, email: 'hannah.wilson@yahoo.co.uk' },
    { first_name: 'Ian', last_name: 'Taylor', nationality: 'CA', esn_card: true, email: 'ian.taylor@icloud.com' },
    { first_name: 'Jack', last_name: 'Johnson', nationality: 'US', esn_card: false, email: 'jack.johnson@protonmail.com' },
    { first_name: 'Liam', last_name: 'Williams', nationality: 'AU', esn_card: true, email: 'liam.williams@yahoo.com' },
    { first_name: 'Maria', last_name: 'Lopez', nationality: 'ES', esn_card: true, email: 'maria.lopez@live.com' },
    { first_name: 'Niels', last_name: 'Jans', nationality: 'NL', esn_card: false, email: 'niels.jans@telenet.be' },
    { first_name: 'Sofie', last_name: 'Peeters', nationality: 'BE', esn_card: true, email: 'sofie.peeters@skynet.be' },
    { first_name: 'Olivia', last_name: 'Martin', nationality: 'FR', esn_card: false, email: 'olivia.martin@ucll.be' },
    { first_name: 'Tomas', last_name: 'Novak', nationality: 'CZ', esn_card: true, email: 'tomas.novak@kuleuven.be' },
    { first_name: 'Petra', last_name: 'Horvath', nationality: 'HU', esn_card: false, email: 'petra.horvath@gmail.com' },
    { first_name: 'Andrei', last_name: 'Popescu', nationality: 'RO', esn_card: true, email: 'andrei.popescu@outlook.com' },
    { first_name: 'Ana', last_name: 'Silva', nationality: 'PT', esn_card: false, email: 'ana.silva@yahoo.com' },
    { first_name: 'Bruno', last_name: 'Souza', nationality: 'BR', esn_card: true, email: 'bruno.souza@hotmail.co.uk' },
    { first_name: 'Lucia', last_name: 'Rossi', nationality: 'IT', esn_card: true, email: 'lucia.rossi@esnleuven.be' },
    { first_name: 'Mark', last_name: 'OConnor', nationality: 'IE', esn_card: false, email: 'mark.oconnor@gmail.com' },
    { first_name: 'Ingrid', last_name: 'Svensson', nationality: 'SE', esn_card: true, email: 'ingrid.svensson@hotmail.com' },
    { first_name: 'Lars', last_name: 'Hansen', nationality: 'NO', esn_card: false, email: 'lars.hansen@live.com' },
    { first_name: 'Jonas', last_name: 'Meier', nationality: 'CH', esn_card: true, email: 'jonas.meier@protonmail.com' },
    { first_name: 'Emma', last_name: 'Schmidt', nationality: 'AT', esn_card: false, email: 'emma.schmidt@example.com' },
    { first_name: 'Zoltan', last_name: 'Kovacs', nationality: 'HU', esn_card: true, email: 'zoltan.kovacs@kuleuven.be' },
    { first_name: 'Mei', last_name: 'Li', nationality: 'CN', esn_card: false, email: 'mei.li@gmail.com' },
    { first_name: 'Sipho', last_name: 'Nkosi', nationality: 'ZA', esn_card: true, email: 'sipho.nkosi@icloud.com' },
    { first_name: 'Miguel', last_name: 'Fernandez', nationality: 'MX', esn_card: false, email: 'miguel.fernandez@student.kuleuven.be' },
    // Additional entries with deliberate domain typos to test recipients summary
    { first_name: 'Noah', last_name: 'Baker', nationality: 'GB', esn_card: false, email: 'noah.baker@gamil.com' },
    { first_name: 'Sara', last_name: 'Ng', nationality: 'IE', esn_card: true, email: 'sara.ng@gnail.com' },
    { first_name: 'Tom', last_name: 'Lee', nationality: 'US', esn_card: false, email: 'tom.lee@yaho.com' },
    { first_name: 'Yara', last_name: 'Khan', nationality: 'PK', esn_card: true, email: 'yara.khan@outlok.com' },
    { first_name: 'Pablo', last_name: 'Diaz', nationality: 'ES', esn_card: false, email: 'pablo.diaz@esnleuven.coom' },
    { first_name: 'Marta', last_name: 'Gomez', nationality: 'ES', esn_card: true, email: 'marta.gomez@kuleuven.co' },
    { first_name: 'Luca', last_name: 'Bianchi', nationality: 'IT', esn_card: false, email: 'luca.bianchi@hotmial.com' },
    { first_name: 'Amina', last_name: 'Saleh', nationality: 'EG', esn_card: true, email: 'amina.saleh@icloud.comm' },
    { first_name: 'Noah', last_name: 'Baker', nationality: 'GB', esn_card: false, email: 'noah.baker@gamil.com' },
    { first_name: 'Sara', last_name: 'Ng', nationality: 'IE', esn_card: true, email: 'sara.ng@gnail.com' },
    { first_name: 'Tom', last_name: 'Lee', nationality: 'US', esn_card: false, email: 'tom.lee@yaho.com' },
    { first_name: 'Yara', last_name: 'Khan', nationality: 'PK', esn_card: true, email: 'yara.khan@outlok.com' },
    { first_name: 'Pablo', last_name: 'Diaz', nationality: 'ES', esn_card: false, email: 'pablo.diaz@esnleuven.coom' },
    { first_name: 'Marta', last_name: 'Gomez', nationality: 'ES', esn_card: true, email: 'marta.gomez@kuleuven.co' },
    { first_name: 'Luca', last_name: 'Bianchi', nationality: 'IT', esn_card: false, email: 'luca.bianchi@hotmial.com' },
    { first_name: 'Amina', last_name: 'Saleh', nationality: 'EG', esn_card: true, email: 'amina.saleh@icloud.comm' },
];
*/


export default function Ticketing() {
    const props = usePage<SharedData>().props;
    const events: any[] = Array.isArray(props['events']) ? props['events'] : [];

    const fields = React.useMemo(() => (sampleData.length ? Object.keys(sampleData[0]) : []), []);

    // Mapping dropdowns
    const [firstNameField, setFirstNameField] = React.useState<string>(fields[0] ?? 'first_name');
    const [lastNameField, setLastNameField] = React.useState<string>(fields[1] ?? 'last_name');
    const [emailField, setEmailField] = React.useState<string>(fields[4] ?? 'email');

    // Mail information (normal | qr embedding)
    const [mailMode, setMailMode] = React.useState<'normal' | 'qr'>('normal');
    const [qrEventName, setQrEventName] = React.useState<string>('');
    const [qrEventDate, setQrEventDate] = React.useState<string>('');
    const [nullableFields, setNullableFields] = React.useState<Record<string, boolean>>(() => {
        const m: Record<string, boolean> = {};
        fields.forEach((f) => { m[f] = false; });
        return m;
    });

    // keep nullableFields in sync if sample columns change
    React.useEffect(() => {
        setNullableFields((prev) => {
            const next: Record<string, boolean> = {};
            fields.forEach((f) => { next[f] = prev[f] ?? false; });
            return next;
        });
    }, [fields]);

    // Email composition
    const [subject, setSubject] = React.useState<string>('Your ticket information');
    const bodyRef = React.useRef<HTMLDivElement | null>(null);

    // Selected event id — default to none so the placeholder shows
    const [selectedEvent, setSelectedEvent] = React.useState<number | null>(null);

    // Preview / generated payload
    const [generated, setGenerated] = React.useState<any[] | null>(null);
    const [showRendered, setShowRendered] = React.useState(true);
    const [selectedSampleIndex, setSelectedSampleIndex] = React.useState<number | null>(0);

    // Default email template (initial editor content)
    const defaultBodyTemplate = React.useMemo(() => {
        return `
            <p>Hello <strong>{{${firstNameField}}}</strong>,</p>
            <p>Thanks for registering — below are your ticket details for the event.</p>
            <ul>
                <li><strong>Event:</strong> {{event_name}}</li>
                <li><strong>Date:</strong> {{event_date}}</li>
                <li><strong>Bring:</strong> Your ESN card (if applicable)</li>
            </ul>
            <p>Please bring a copy of this email (printed or on your phone).</p>
            <p>See you there,<br/>ESN Leuven</p>
        `;
    }, [firstNameField]);

    // initialize editor with default template if empty
    React.useEffect(() => {
        if (bodyRef.current && (!bodyRef.current.innerHTML || bodyRef.current.innerHTML.trim() === '')) {
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
            if (bodyRef.current && bodyRef.current.contains(range.commonAncestorContainer)) {
                try {
                    // Try native command first
                    const success = document.execCommand('createLink', false, url);

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
                        const hasLinkInSelection = Array.from(links).some((a) => {
                            try {
                                return sel.getRangeAt(0).intersectsNode(a);
                            } catch (e) {
                                return false;
                            }
                        });

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

        // Find selected event metadata to enrich the generated payload and the template
        const eventObj = events.find((ev: any) => ev.id === selectedEvent) ?? null;

        const buildEmailHtml = (innerHtml: string, ev: any | null) => {
            const eventTitle = ev ? `${ev.name}` : '';
            const eventDate = ev && ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

            // Minimalist email template inspired by NIMAH design
            return `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfcf9; border: 1px solid #d4c5a9;">
                    <div style="text-align: center; padding: 40px 20px 20px; border-bottom: 1px solid #d4c5a9;">
                        <div style="font-size: 32px; font-weight: 300; letter-spacing: 4px; color: #2c2416; margin-bottom: 8px;">ESN LEUVEN</div>
                        <div style="font-size: 11px; letter-spacing: 2px; color: #8b7355; font-weight: 500;">Announcement</div>
                    </div>
                    
                    <div style="padding: 50px 40px; color: #5a4a3a; line-height: 1.8;">
                        <h1 style="font-size: 28px; font-weight: 300; color: #2c2416; margin: 0 0 20px 0; text-align: center;">${eventTitle}</h1>
                        <p style="text-align: center; color: #8b7355; font-size: 14px; margin: 0 0 30px 0;">${eventDate}</p>
                        ${innerHtml}
                    </div>
                    
                    <div style="padding: 30px 40px; border-top: 1px solid #d4c5a9; background-color: #f8f6f0; text-align: center;">
                        <p style="margin: 0 0 10px 0; font-size: 13px; color: #5a4a3a;">© 2025 ESN Leuven. All rights reserved.</p>
                        <div style="font-size: 13px; color: #8b7355; margin-bottom: 10px;">
                            <a href="https://www.instagram.com/esnleuven/" target="_blank" style="color: #8b7355; text-decoration: none;">Instagram</a> | 
                            <a href="https://linktr.ee/esnleuven" target="_blank" style="color: #8b7355; text-decoration: none;">Linktree</a> | 
                            <a href="https://www.esnleuven.be/" target="_blank" style="color: #8b7355; text-decoration: none;">Website</a>
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #a39482;">You received this email because you registered for an ESN Leuven communication.</p>
                    </div>
                </div>
            `;
        };

        const out = sampleData.map((row) => ({
            first_name: String((row as any)[firstNameField] ?? ''),
            last_name: String((row as any)[lastNameField] ?? ''),
            email: String((row as any)[emailField] ?? ''),
            event_id: selectedEvent,
            event_name: eventObj ? eventObj.name : null,
            event_date: eventObj ? eventObj.event_date : null,
            subject,
            body: buildEmailHtml(bodyHtml, eventObj),
            // mail metadata (mode and qr-related settings)
            mail_mode: mailMode,
            mail_qr: {
                event_name: qrEventName,
                event_date: qrEventDate,
                nullable_fields: nullableFields,
            },
        }));

        setGenerated(out);
        // For now we do not POST anywhere; this prepares the payload ready to be used by your mailer.
        console.log('Prepared tickets', out);
    };

    const [sending, setSending] = React.useState<boolean>(false);
    const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);

    // Helper to read a cookie value
    const getCookie = (name: string): string | null => {
        const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
        return match ? match.split('=')[1] ?? null : null;
    };

    const sendDistribution = async () => {
        if (mailMode !== 'normal') {
            // Only normal mail is supported at this time
            window.alert('Only Normal mail distribution is supported right now. Switch to "Normal mail" and try again.');
            return;
        }

        // Ensure we have a generated payload
        if (!generated) {
            generateTickets();
        }

        const payload = generated ?? [];

        if (!payload.length) {
            window.alert('No recipients found to distribute to. Generate preview first.');
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
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            // Laravel sets XSRF-TOKEN cookie (URL encoded). Send it as X-XSRF-TOKEN header.
            const xsrfCookie = getCookie('XSRF-TOKEN');
            const xsrf = xsrfCookie ? decodeURIComponent(xsrfCookie) : '';

            const resp = await fetch('/distribute-emails', {
                method: 'POST',
                credentials: 'same-origin', // ensure cookies (session/XSRF) are sent
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-XSRF-TOKEN': xsrf,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ recipients: generated ?? [] }),
            });

            if (resp.status === 419) {
                let json = {} as any;
                try { json = await resp.json(); } catch (_) { /* ignore */ }
                throw new Error(`CSRF token mismatch (419). ${json.message ?? ''} Please refresh the page and try again.`);
            }

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Server error: ${resp.status} ${txt}`);
            }

            const data = await resp.json();
            window.alert(`Distribution queued. Jobs created: ${data.queued_count ?? 0}`);
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
                    <div className="md:col-span-2 space-y-3">
                        <div>
                            <Label>Subject</Label>
                            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                        </div>

                        <div>
                            <Label>Message</Label>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Button onClick={() => applyFormat('bold')} size="sm" variant="outline" aria-label="Bold">B</Button>
                                <Button onClick={() => applyFormat('italic')} size="sm" variant="outline" aria-label="Italic">I</Button>
                                <Button onClick={() => applyFormat('underline')} size="sm" variant="outline" aria-label="Underline">U</Button>
                                <Button onClick={insertBulletList} size="sm" variant="outline" aria-label="Insert list">•</Button>
                                <Button onClick={insertLink} size="sm" variant="outline" aria-label="Insert link">🔗</Button>
                                <Button onClick={removeLink} size="sm" variant="outline" aria-label="Remove link">⛔</Button>
                                <Button onClick={setTextColor} size="sm" variant="outline" aria-label="Text color" style={{ color: '#d97706' }}>A</Button>
                                <Button onClick={setBgColor} size="sm" variant="outline" aria-label="Background color" style={{ background: '#fde68a', color: '#222' }}>Bg</Button>
                            </div>
                            <div
                                ref={bodyRef}
                                contentEditable
                                suppressContentEditableWarning
                                className="min-h-[180px] w-full rounded-md border p-3 bg-black text-sm text-foreground"
                                style={{ overflowY: 'auto' }}
                            >
                                <p>Dear {'{{first_name}}'},</p>
                                <br></br>
                                <p>The Welcome Weekend is finally here 🎊 This is your chance to join us for an unforgettable getaway in Durbuy, where endless fun awaits you!</p>
                                <br></br>
                                
                                <h2>What we will do:</h2>
                                <ul>
                                    <li>🏡 Enjoy a cozy stay in one big house with everyone!</li>
                                    <li>🏛 Indulge in a delicious brunch, explore nature on a walk, and challenge each other during quiz night!</li>
                                    <li>🎤 Get ready for a lively cantus with the theme <strong>Brat vs. Demure</strong> - show us your wild or classy side! Plus, we’re having an epic pyjama party, so bring your comfiest, craziest PJs! We’ll also enjoy karaoke, game night, and so much more!</li>
                                    <li>🍔 We’ve got the food and drinks covered - just bring your boundless energy!</li>
                                </ul>
                                <br></br>
                                
                                <h2>What to bring:</h2>
                                <ul>
                                    <li>🧳 Clothes for the Brat vs. Demure cantus and your best outfit for the pyjama party!</li>
                                    <li>🛏 Bed linen (for over the mattress), pillowcases, towels and sleeping bag (optional).</li>
                                    <li>🧥 Rain jacket - just in case the weather decides to play tricks on us!</li>
                                    <li>🎟️ And of course, don’t forget to keep your QR-ticket handy when you approach the bus.</li>
                                </ul>
                                
                                <br></br>
                                <p>🗓 <strong>When:</strong> Friday, October 18, 14:00 – Sunday, October 20, 18:00</p>
                                <p>🚌 <strong>Meeting Point:</strong> Parking Bodart (14:00 at the latest)</p>
                                <p>📍 <strong>Destination:</strong> Durbuy</p>
                                <br></br>
                                
                                <p>You can find the room allocation plan through the following link. You may start planning your next sleep (fill it in) 💤:<br />
                                <a href="https://docs.google.com/spreadsheets/d/1kSL913cMP2S2Y798Z-Fijill4aZNGbkrRhj7-aTlBWI/edit?usp=sharing" target="_blank">Room Allocation Plan Link</a></p>
                                <br></br>
                                
                                <p>Get ready for an epic adventure filled with laughter and great memories! We can’t wait to see you all there!</p>
                                <br></br>
                                
                                <p>Best wishes,<br />
                                Daniel</p>
                            </div>
                        </div>

                        {/* Responsive event/sample selector and event info section */}
                        <div className="mt-4 flex flex-wrap items-end gap-4 md:gap-6">

                            <div className="flex flex-col min-w-[220px] max-w-[320px] flex-1 mt-2 space-y-2">
                                <div>
                                    <Label htmlFor="event-select">Event</Label>
                                    <select
                                        id="event-select"
                                        value={String(selectedEvent ?? '')}
                                        onChange={(e) => setSelectedEvent(Number(e.target.value) || null)}
                                        className="rounded-md border p-2 w-full min-w-[180px] max-w-full"
                                    >
                                        <option value="">-- Select event --</option>
                                        {events.length === 0 ? (
                                            <option value="">No events available</option>
                                        ) : (
                                            events.map((ev: any) => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.name} {ev.event_date ? `(${new Date(ev.event_date).toLocaleDateString()})` : ''}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col min-w-[220px] max-w-[320px] flex-1 mt-2 space-y-2">
                                <div>
                                    <Label htmlFor="sample-user-select">Sample user</Label>
                                    <select
                                        id="sample-user-select"
                                        value={String(selectedSampleIndex ?? '')}
                                        onChange={(e) => setSelectedSampleIndex(e.target.value === '' ? null : Number(e.target.value))}
                                        className="rounded-md border p-2 w-full min-w-[180px] max-w-full text-sm"
                                    >
                                        {sampleData.map((s, i) => (
                                            <option key={i} value={i}>{s.first_name} {s.last_name} — {s.email}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end">
                                <div className="flex gap-2">
                                    <Button onClick={generateTickets} className="w-full md:w-auto">Generate Preview</Button>
                                    <Button onClick={sendDistribution} className="w-full md:w-auto" disabled={sending} variant="destructive">{sending ? 'Sending…' : 'Distribute (real)'}</Button>
                                </div>
                                {/* Confirmation dialog for distribution */}
                                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                                    <DialogContent className="!w-[95vw] max-h-[80vh] !max-w-md p-4">
                                        <DialogTitle>Confirm distribution</DialogTitle>
                                        <DialogDescription>
                                            You are about to distribute the prepared email to <strong>{(generated ?? []).length}</strong> recipients. This will enqueue background jobs to send the messages. Do you want to proceed?
                                        </DialogDescription>

                                        <div className="mt-4 text-xs text-muted-foreground">Queued sending is recommended for large recipient lists and will run in the background (run <code>php artisan queue:work</code> to process).</div>

                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="ghost">Cancel</Button>
                                            </DialogClose>
                                            <Button onClick={proceedSendDistribution} className="ml-2">Confirm & Queue</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Event details area (always rendered below selectors) */}
                            <div className="w-full basis-full mt-4">
                                {(() => {
                                    if (selectedEvent === null) {
                                        return <div className="text-sm text-muted-foreground">No event selected</div>;
                                    }
                                    const ev = events.find((x: any) => x.id === selectedEvent) ?? null;
                                    if (!ev) return <div className="text-sm text-muted-foreground">Event not found</div>;

                                    const rows: Array<{label: string; value: string}> = [];
                                    if (ev.name) rows.push({ label: 'Name', value: String(ev.name) });
                                    if (ev.event_date) rows.push({ label: 'Event date', value: new Date(ev.event_date).toLocaleString() });
                                    if (ev.start_sell_date) rows.push({ label: 'Start selling', value: new Date(ev.start_sell_date).toLocaleString() });
                                    if (ev.end_sell_date) rows.push({ label: 'End selling', value: new Date(ev.end_sell_date).toLocaleString() });
                                    if (ev.price_with_card !== undefined) rows.push({ label: 'Price (with ESN card)', value: `€${Number(ev.price_with_card).toFixed(2)}` });
                                    if (ev.price_without_card !== undefined) rows.push({ label: 'Price (without ESN card)', value: `€${Number(ev.price_without_card).toFixed(2)}` });
                                    if (ev.variable_amount) rows.push({ label: 'Variable amount', value: ev.variable_amount ? 'Yes' : 'No' });
                                    if (ev.quantity !== undefined && ev.quantity !== null) rows.push({ label: 'Quantity', value: String(ev.quantity) });
                                    if (ev.quantity_with_card !== undefined && ev.quantity_with_card !== null) rows.push({ label: 'Quantity (with card)', value: String(ev.quantity_with_card) });
                                    if (ev.quantity_without_card !== undefined && ev.quantity_without_card !== null) rows.push({ label: 'Quantity (without card)', value: String(ev.quantity_without_card) });
                                    if (ev.responsibleUser) rows.push({ label: 'Responsible', value: `${ev.responsibleUser.first_name} ${ev.responsibleUser.last_name}` });
                                    if (ev.notes) rows.push({ label: 'Notes', value: String(ev.notes) });

                                    return (
                                        <div className="bg-muted/40 rounded p-3 mt-2 text-sm w-full max-w-xl">
                                            <Label className="mb-1">Event details</Label>
                                            <ul className="list-disc pl-5 text-sm">
                                                {rows.map((r) => (
                                                    <li key={r.label}><strong>{r.label}:</strong> {r.value}</li>
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
                            <h4 className="text-sm font-semibold">Field Mapping</h4>
                                    <div className="mt-2 space-y-2">
                                        <div>
                                            <Label>First name source</Label>
                                            <select value={firstNameField} onChange={(e) => setFirstNameField(e.target.value)} className="rounded-md border p-2 w-full">
                                                <option value="">— No mapping available —</option>
                                                {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>

                                <div>
                                    <Label>Last name source</Label>
                                    <select value={lastNameField} onChange={(e) => setLastNameField(e.target.value)} className="rounded-md border p-2 w-full">
                                        <option value="">— No mapping available —</option>
                                        {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <Label>Email source</Label>
                                    <select value={emailField} onChange={(e) => setEmailField(e.target.value)} className="rounded-md border p-2 w-full">
                                        <option value="">— No mapping available —</option>
                                        {fields.map((f) => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>

                        {/* Mail information section: choose normal mail or mail with QR embedding. If QR selected show event name/date inputs and per-column nullable radios */}
                        <div className="mt-10">
                            <h4 className="text-sm font-semibold">Mail information</h4>
                            <div className="mt-2 space-y-3">
                                <div>
                                    <Label>Mail type</Label>
                                    <div className="flex gap-4 mt-1">
                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="mailMode"
                                                value="normal"
                                                checked={mailMode === 'normal'}
                                                onChange={() => setMailMode('normal')}
                                            />
                                            <span className="ml-1">Normal mail</span>
                                        </label>

                                        <label className="inline-flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="mailMode"
                                                value="qr"
                                                checked={mailMode === 'qr'}
                                                onChange={() => setMailMode('qr')}
                                            />
                                            <span className="ml-1">Mail with QR embedding</span>
                                        </label>
                                    </div>
                                </div>
                                {/* QR-specific inputs (only shown when QR mail selected) */}
                                {mailMode === 'qr' && (
                                    <div className="space-y-3">
                                        <div>
                                            <Label>QR: Event name</Label>
                                            <Input value={qrEventName} onChange={(e) => setQrEventName(e.target.value)} placeholder="Optional event name" />
                                        </div>

                                        <div>
                                            <Label>QR: Event date</Label>
                                            <Input value={qrEventDate} onChange={(e) => setQrEventDate(e.target.value)} placeholder="Optional event date" />
                                        </div>
                                    </div>
                                )}

                                {/* Column nullable controls — visible regardless of mail mode */}
                                <div>
                                    <Label>Skippable columns: can undefined user values be gracefully skipped?</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                        {fields.map((f) => (
                                            <div key={f} className="flex items-center gap-4">
                                                <div className="w-36 text-xs text-muted-foreground">{`{{${f}}}`}</div>
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`nullable-${f}`}
                                                        checked={!nullableFields[f]}
                                                        onChange={() => setNullableFields((prev) => ({ ...prev, [f]: false }))}
                                                    />
                                                    <span className="ml-1">Required [appear as "undefined"]</span>
                                                </label>

                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name={`nullable-${f}`}
                                                        checked={Boolean(nullableFields[f])}
                                                        onChange={() => setNullableFields((prev) => ({ ...prev, [f]: true }))}
                                                    />
                                                    <span className="ml-1">Skippable</span>
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
                                <h4 className="text-sm font-semibold"> Data Source Preview...</h4>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="ghost">Manage</Button>
                                    </DialogTrigger>
                                    <DialogContent className="!w-[95vw] !max-w-[95vw] h-[90vh] sm:!max-w-[95vw] p-4 flex flex-col overflow-hidden">
                                            <DialogTitle>Sample Data Source</DialogTitle>
                                            <DialogDescription>
                                                <div className="text-xs text-muted-foreground">Total entries: {sampleData.length}</div>
                                            </DialogDescription>

                                            {/* content area grows and allows internal panes to scroll independently */}
                                            <div className="mt-4 flex-1 min-h-0 overflow-hidden">
                                                <div className="grid grid-cols-3 gap-4 h-full min-h-0">
                                                    {/* Full data table with vertical scroll */}
                                                    <div className="col-span-2 min-h-0">
                                                        <div className="h-full max-h-[75vh] overflow-y-auto rounded border">
                                                            <table className="w-full text-xs table-fixed">
                                                                <thead>
                                                                    <tr>
                                                                        {fields.map((f) => (
                                                                            <th
                                                                                key={f}
                                                                                className="text-left pr-2 text-xs sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b"
                                                                            >
                                                                                {f}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {sampleData.map((r, idx) => (
                                                                        <tr key={idx} className="border-t">
                                                                            {fields.map((f) => (
                                                                                <td key={f} className="py-1 pr-2 align-top text-xs">
                                                                                    <span className="inline-block w-full truncate" title={String((r as any)[f] ?? '')}>{String((r as any)[f] ?? '')}</span>
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Recipient summary with vertical scroll */}
                                                    <div className="col-span-1 min-h-0">
                                                        <div className="border rounded-md p-4 bg-background h-full max-h-[75vh] overflow-y-auto flex flex-col">
                                                            <div className="flex-shrink-0">
                                                                <h4 className="text-sm font-semibold">Recipients summary</h4>
                                                                <p className="text-xs text-muted-foreground mt-1">Summary of destination domains and potential typos</p>
                                                            </div>
                                                            <div className="mt-3">
                                                                {/* compute domain summary client-side from sampleData */}
                                                                {(() => {
                                                                const emails: string[] = sampleData.map((s) => String((s as any).email ?? '').trim()).filter(Boolean);
                                                                const domains: string[] = emails.map((e) => (e.includes('@') ? e.split('@')[1].toLowerCase() : ''));
                                                                const domainCounts: Record<string, number> = {};
                                                                domains.forEach((d) => { if (d) domainCounts[d] = (domainCounts[d] || 0) + 1; });

                                                                const knownDomains = [
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

                                                                const domainEntries = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
                                                                const suspicious = domainEntries.filter(([d]) => !knownDomains.includes(d));

                                                                return (
                                                                    <div className="text-xs space-y-3">
                                                                        <div>
                                                                            <div className="text-xs font-medium">Known domains</div>
                                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                                {knownDomains.join(', ')}
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <div className="text-xs font-medium">Domain counts</div>
                                                                            <ul className="mt-1 list-disc pl-5">
                                                                                {domainEntries.length === 0 ? (
                                                                                    <li className="text-muted-foreground">No recipient emails found</li>
                                                                                ) : (
                                                                                    domainEntries.map(([d, c]) => (
                                                                                        <li key={d} className={"flex items-center justify-between " + (knownDomains.includes(d) ? '' : 'text-red-600')}>
                                                                                            <span className="mr-2">{d}</span>
                                                                                            <span className="text-muted-foreground">{c}</span>
                                                                                        </li>
                                                                                    ))
                                                                                )}
                                                                            </ul>
                                                                        </div>


                                                                        {suspicious.length > 0 && (
                                                                            <div>
                                                                                <div className="text-xs font-medium text-red-600">Potential typos</div>
                                                                                <div className="mt-1 text-xs">
                                                                                    {suspicious.map(([d]) => (
                                                                                        <div key={d} className="mb-1">
                                                                                            <div className="font-medium">{d}</div>
                                                                                            <div className="text-muted-foreground">Addresses:</div>
                                                                                            <ul className="list-disc pl-5 text-xs mt-1">
                                                                                                {emails.filter((e) => e.endsWith(`@${d}`)).slice(0,5).map((e) => <li key={e}>{e}</li>)}
                                                                                            </ul>
                                                                                        </div>
                                                                                    ))}
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
                                <table className="w-full text-xs table-fixed">
                                    <thead>
                                        <tr>
                                            <th className="text-left pr-2 w-[6.5rem] min-w-[6.5rem]">{firstNameField}</th>
                                            <th className="text-left pr-2 w-[6.5rem] min-w-[6.5rem]">{lastNameField}</th>
                                            <th className="text-left pr-2">{emailField}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleData.slice(0, 10).map((r, idx) => (
                                            <tr key={idx} className="border-t">
                                                <td className="py-1 pr-2"><span title={String((r as any)[firstNameField] ?? '')} className="inline-block w-full truncate">{String((r as any)[firstNameField] ?? '')}</span></td>
                                                <td className="py-1 pr-2"><span title={String((r as any)[lastNameField] ?? '')} className="inline-block w-full truncate">{String((r as any)[lastNameField] ?? '')}</span></td>
                                                <td className="py-1 pr-2"><span title={String((r as any)[emailField] ?? '')} className="inline-block w-full truncate">{String((r as any)[emailField] ?? '')}</span></td>
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
                                <div className="text-sm mb-1">Render format</div>
                                <div role="tablist" aria-orientation="horizontal" className="bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
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
                                    <pre className="text-xs bg-muted p-3 rounded">{JSON.stringify(generated, null, 2)}</pre>
                                )}

                                {showRendered && (
                                    <div className="border rounded p-3 bg-white">
                                        <h5 className="text-sm font-medium mb-2">Rendered HTML Preview</h5>
                                        {selectedSampleIndex === null ? (
                                            <div className="text-sm text-muted-foreground">Select a sample user to preview rendered email.</div>
                                        ) : (
                                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: (() => {
                                                const user = sampleData[selectedSampleIndex as number];
                                                // simple token replacement for {{field}}
                                                const html = generated[Number(selectedSampleIndex as number)]?.body ?? '';
                                                return html.replace(/{{\s*(\w+)\s*}}/g, (_m: string, p1: string) => String((user as any)[p1] ?? ''));
                                            })() }} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">No preview generated yet. Click Generate Preview.</div>
                        )}
                    </div>
                    </div>
                </div>
            
        </AppLayout>
    );
}
