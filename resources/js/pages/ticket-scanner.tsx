import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { CameraOff } from 'lucide-react';
import * as React from 'react';

export default function TicketScanner() {
    const props: any = usePage().props;
    const events: any[] = Array.isArray(props.events) ? props.events : [];
    const initialTickets: any[] = [];

    // Only show events happening within the next 14 days (inclusive)
    // Assumption: "within 14 days of current day" means from now up to now + 14 days.
    const filteredEvents = React.useMemo(() => {
        const now = new Date();
        const end = new Date();
        end.setDate(now.getDate() + 14);
        return events.filter((ev) => {
            if (!ev || !ev.event_date) return false;
            const d = new Date(ev.event_date);
            return d >= now && d <= end;
        });
    }, [events]);

    // Default to no event selected so the select shows the placeholder "-- select event --"
    const [selectedEvent, setSelectedEvent] = React.useState<number | null>(
        null,
    );

    const selectedEventObj = React.useMemo(() => {
        return events.find((ev) => ev.id === selectedEvent) ?? null;
    }, [events, selectedEvent]);

    const [tickets, setTickets] = React.useState<any[]>(initialTickets);
    const [scannedTickets, setScannedTickets] = React.useState<any[]>([]);
    const [scanning, setScanning] = React.useState(false);
    const [ticketsLoaded, setTicketsLoaded] = React.useState(false);
    const [scanModal, setScanModal] = React.useState<null | {
        status: 'legit' | 'already' | 'false';
        ticket?: any;
        raw?: string;
        wasScanning?: boolean;
    }>(null);
    const [selectedScannedTicket, setSelectedScannedTicket] = React.useState<
        any | null
    >(null);
    const [lastScan, setLastScan] = React.useState<string>('');
    const [selectedAttendee, setSelectedAttendee] = React.useState<any | null>(
        null,
    );

    const scannerRef = React.useRef<any>(null);
    const readerDivRef = React.useRef<HTMLDivElement>(null);
    const processingRef = React.useRef<Set<string>>(new Set());
    const wasScanningRef = React.useRef<boolean>(false);

    // Load tickets for selected event from the database
    const loadTickets = async () => {
        if (!selectedEvent) return alert('Select an event first');
        // Clear page state before loading new event
        setScanModal(null);
        setLastScan('');
        setScannedTickets([]);
        setTickets([]);
        setTicketsLoaded(false);
        setSelectedScannedTicket(null);
        // stop camera if running
        if (scanning) {
            try {
                await stopCamera();
            } catch (e) {
                void e;
            }
        }

        // Load available tickets (scan_count = 0)
        const availableRes = await fetch(
            `/ticket-scanner/available-tickets?event_id=${selectedEvent}`,
            {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            },
        );
        if (availableRes.ok) {
            const data = await availableRes.json();
            setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        } else {
            const err = await availableRes.text();
            alert('Failed to load available tickets: ' + err);
            return;
        }

        // Load scanned tickets (scan_count > 0)
        const scannedRes = await fetch(
            `/ticket-scanner/scanned-tickets?event_id=${selectedEvent}`,
            {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            },
        );
        if (scannedRes.ok) {
            const data = await scannedRes.json();
            setScannedTickets(Array.isArray(data.tickets) ? data.tickets : []);
        } else {
            const err = await scannedRes.text();
            alert('Failed to load scanned tickets: ' + err);
            return;
        }

        setTicketsLoaded(true);
    };

    // Reset loaded state when selecting a different event so UI won't show wrong event name
    React.useEffect(() => {
        setTicketsLoaded(false);
        setTickets(initialTickets);
        setScannedTickets([]);
    }, [selectedEvent]);

    const verifyTicket = async (ticketId: string) => {
        // Prevent duplicate processing
        if (processingRef.current.has(ticketId)) {
            return { valid: false };
        }

        processingRef.current.add(ticketId);

        // Pause camera while processing
        const wasScanning = scanning;
        if (scanning) {
            try {
                await stopCamera();
            } catch (e) {
                // ignore
            }
        }

        try {
            const url = `/ticket-scanner/verify?ticket_id=${encodeURIComponent(ticketId)}&event_id=${selectedEvent}`;
            const res = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (res.ok) {
                const data = await res.json();

                // Decide status
                let status: 'legit' | 'already' | 'false' = 'false';
                if (data.valid && data.ticket) {
                    const t = data.ticket;
                    // Use previous_scan_count returned by server to determine if this was already scanned
                    const alreadyServer =
                        typeof data.previous_scan_count !== 'undefined'
                            ? Number(data.previous_scan_count) > 0
                            : !!(t.scan_count && Number(t.scan_count) > 0);
                    status = alreadyServer ? 'already' : 'legit';

                    setLastScan(`✓ ${t.first_name} ${t.last_name}`);
                    if ('vibrate' in navigator) navigator.vibrate(200);

                    // Reload tickets from database to update both lists
                    if (selectedEvent) {
                        const availableRes = await fetch(
                            `/ticket-scanner/available-tickets?event_id=${selectedEvent}`,
                            {
                                headers: {
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            },
                        );
                        if (availableRes.ok) {
                            const availableData = await availableRes.json();
                            setTickets(
                                Array.isArray(availableData.tickets)
                                    ? availableData.tickets
                                    : [],
                            );
                        }

                        const scannedRes = await fetch(
                            `/ticket-scanner/scanned-tickets?event_id=${selectedEvent}`,
                            {
                                headers: {
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            },
                        );
                        if (scannedRes.ok) {
                            const scannedData = await scannedRes.json();
                            setScannedTickets(
                                Array.isArray(scannedData.tickets)
                                    ? scannedData.tickets
                                    : [],
                            );
                        }
                    }
                } else if (data.ticket) {
                    // Server returned a ticket object but marked invalid
                    const t = data.ticket;
                    const alreadyServer =
                        typeof data.previous_scan_count !== 'undefined'
                            ? Number(data.previous_scan_count) > 0
                            : !!(t.scan_count && Number(t.scan_count) > 0);
                    status = alreadyServer ? 'already' : 'false';
                    setLastScan(`✗ Invalid ticket`);
                    if ('vibrate' in navigator)
                        navigator.vibrate([100, 50, 100]);
                    setScanModal({ status, ticket: t, wasScanning });
                    return data;
                } else {
                    setLastScan(`✗ Invalid ticket`);
                    if ('vibrate' in navigator)
                        navigator.vibrate([100, 50, 100]);
                    setScanModal({
                        status: 'false',
                        raw: ticketId,
                        wasScanning,
                    });
                    return { valid: false };
                }

                // Show modal with details
                setScanModal({ status, ticket: data.ticket, wasScanning });
                return data;
            } else {
                // Non-OK responses (forged QR or not found) should show modal with raw content
                setLastScan(`✗ Unknown ticket`);
                if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
                setScanModal({ status: 'false', raw: ticketId, wasScanning });
                return { valid: false };
            }
        } catch (e) {
            console.error('Verification error:', e);
            setLastScan(`✗ Error verifying ticket`);
        } finally {
            // Remove from processing after 1 second to allow rescanning if needed
            setTimeout(() => {
                processingRef.current.delete(ticketId);
            }, 1000);
        }

        return { valid: false };
    };

    const startCameraScan = async () => {
        try {
            setScanning(true);
            setLastScan('');

            // Dynamically import html5-qrcode
            const { Html5Qrcode } = await import('html5-qrcode');

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            const config = {
                fps: 10, // Scan 10 times per second
                qrbox: { width: 250, height: 250 }, // Scanning box size
                aspectRatio: 1.0,
            };

            await scanner.start(
                { facingMode: 'environment' }, // Use back camera
                config,
                async (decodedText) => {
                    // Success callback - fires on every successful scan
                    if (
                        decodedText &&
                        !processingRef.current.has(decodedText)
                    ) {
                        await verifyTicket(decodedText);
                    }
                },
                (errorMessage) => {
                    // Error callback - fires when no QR code is detected (can be ignored)
                },
            );
        } catch (e) {
            console.error(e);
            alert('Failed to start camera: ' + e);
            setScanning(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (e) {
                console.error('Error stopping scanner:', e);
            }
        }
        setScanning(false);
        processingRef.current.clear();
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    // Pause camera while any modal is open and resume if it was running before
    const modalOpen = Boolean(
        scanModal || selectedAttendee || selectedScannedTicket,
    );
    React.useEffect(() => {
        if (modalOpen) {
            if (scanning) {
                wasScanningRef.current = true;
                stopCamera().catch(() => {});
            }
        } else {
            if (wasScanningRef.current) {
                wasScanningRef.current = false;
                startCameraScan().catch(() => {});
            }
        }
        // only depend on modalOpen and scanning
    }, [modalOpen]);

    // Group tickets by attendee (first_name + last_name + email) - show available attendees in sidebar
    // but compute the count using both available and scanned lists (so x{count} equals "All Tickets Under This Email")
    const attendeeGroups = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        tickets.forEach((ticket) => {
            const key = `${ticket.first_name}|${ticket.last_name}|${ticket.email}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(ticket);
        });

        const allTickets = [...tickets, ...scannedTickets];

        return Object.entries(groups).map(([key, ticketList]) => {
            const [first_name, last_name, email] = key.split('|');
            const emailNorm = (email ?? '').toLowerCase().trim();

            // Count only tickets that belong to this exact attendee (first + last + email).
            // Previously the count compared only by email, which caused every attendee
            // sharing the same email to show the same total. This makes the count per
            // attendee (name + email) so the displayed "x{count}" reflects tickets
            // actually under that attendee.
            const count = allTickets.filter((t) => {
                const tEmail = ((t.email ?? '') + '').toLowerCase().trim();
                const tFirst = (t.first_name ?? '') + '';
                const tLast = (t.last_name ?? '') + '';
                return (
                    tEmail === emailNorm &&
                    tFirst === (first_name ?? '') &&
                    tLast === (last_name ?? '')
                );
            }).length;

            return {
                first_name,
                last_name,
                email,
                tickets: ticketList,
                count,
            };
        });
    }, [tickets, scannedTickets]);

    // Helper function to get all tickets for a given attendee (from both available and scanned lists)
    // NOTE: match by email only (case-insensitive) so tickets with the same email but
    // different attendee names are included.
    const getAllTicketsForAttendee = React.useCallback(
        (
            attendee: {
                first_name?: string;
                last_name?: string;
                email?: string;
            },
            primaryTicket?: any,
        ) => {
            const email = (attendee.email ?? '').toLowerCase().trim();
            if (!email) return [];

            const allTickets = [...tickets, ...scannedTickets];
            // find matches by email (case-insensitive)
            const matches = allTickets.filter(
                (t) => ((t.email ?? '') + '').toLowerCase().trim() === email,
            );

            // dedupe by ticket_id when possible
            const map = new Map<string, any>();
            for (const t of matches) {
                const key =
                    t.ticket_id ?? (t.id ? String(t.id) : JSON.stringify(t));
                if (!map.has(key)) map.set(key, t);
            }

            const result = Array.from(map.values());

            // If a primary ticket is provided (the ticket currently being investigated),
            // ensure that ticket appears first in the list when possible. Match by
            // ticket_id (preferred) or id.
            if (primaryTicket) {
                const primaryId =
                    primaryTicket.ticket_id ??
                    (primaryTicket.id ? String(primaryTicket.id) : null);
                if (primaryId) {
                    const idx = result.findIndex(
                        (t) =>
                            (t.ticket_id ?? (t.id ? String(t.id) : null)) ===
                            primaryId,
                    );
                    if (idx > 0) {
                        const [found] = result.splice(idx, 1);
                        result.unshift(found);
                    }
                }
            }

            return result;
        },
        [tickets, scannedTickets],
    );

    const toggleCamera = async () => {
        if (scanning) {
            await stopCamera();
        } else {
            await startCameraScan();
        }
    };

    return (
        <AppLayout>
            <Head title="Ticket Scanner" />

            <div className="p-2 sm:p-4 md:p-6">
                <h2 className="mb-4 text-lg font-semibold">Ticket Scanner</h2>

                {/* Top grid: three panels (event selector, camera, remaining tickets) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Event selector */}
                    <div className="order-1 rounded-xl border border-sidebar-border/70 p-4 md:order-1 dark:border-sidebar-border">
                        <h4 className="mb-2 text-sm font-medium">Event</h4>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Label className="sr-only">Event</Label>
                                <select
                                    value={String(selectedEvent ?? '')}
                                    onChange={(e) =>
                                        setSelectedEvent(
                                            Number(e.target.value) || null,
                                        )
                                    }
                                    className="w-full rounded-md border p-2"
                                >
                                    <option value="">-- select event --</option>
                                    {filteredEvents.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.name}{' '}
                                            {ev.event_date
                                                ? `(${new Date(ev.event_date).toLocaleString()})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Button
                                    onClick={loadTickets}
                                    className="whitespace-nowrap"
                                >
                                    Load
                                </Button>
                            </div>
                        </div>

                        {/* Selected event details shown in remaining space of event cell */}
                        {selectedEventObj && ticketsLoaded && (
                            <div className="mt-4 rounded border bg-muted/30 p-3">
                                <div className="mb-1 text-sm font-medium">
                                    {selectedEventObj.name}
                                </div>
                                {selectedEventObj.event_date && (
                                    <div className="text-xs text-muted-foreground">
                                        {new Date(
                                            selectedEventObj.event_date,
                                        ).toLocaleString()}
                                    </div>
                                )}
                                {selectedEventObj.location && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Location:{' '}
                                        <span className="font-medium">
                                            {selectedEventObj.location}
                                        </span>
                                    </div>
                                )}
                                {selectedEventObj.description && (
                                    <div className="mt-3 text-sm text-muted-foreground">
                                        {selectedEventObj.description}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Camera / scanner toggle */}
                    <div className="order-3 flex flex-col rounded-xl border border-sidebar-border/70 p-4 md:order-2 dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                                Camera Scanner
                            </h4>
                            <div
                                role="tablist"
                                aria-orientation="horizontal"
                                className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={!scanning}
                                    onClick={
                                        !scanning ? undefined : toggleCamera
                                    }
                                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${!scanning ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                                >
                                    Off
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={scanning}
                                    onClick={
                                        scanning ? undefined : toggleCamera
                                    }
                                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 ${scanning ? 'bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30' : 'text-foreground dark:text-muted-foreground'}`}
                                >
                                    On
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-1 flex-col">
                            <div
                                id="qr-reader"
                                ref={readerDivRef}
                                className={`overflow-hidden rounded-md ${scanning ? '' : 'hidden'}`}
                                style={{ minHeight: scanning ? 'auto' : 160 }}
                            />
                            {!scanning && (
                                <div
                                    className="mt-2 flex flex-1 flex-col items-center justify-center gap-3 rounded-md bg-gray-100"
                                    style={{ minHeight: 160 }}
                                >
                                    <p className="text-center text-lg text-gray-500">
                                        Camera not active
                                    </p>
                                    <CameraOff
                                        className="text-gray-400"
                                        size={36}
                                    />
                                </div>
                            )}

                            {lastScan && (
                                <div
                                    className={`mt-2 rounded p-2 text-sm font-medium ${lastScan.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                >
                                    {lastScan}
                                </div>
                            )}

                            <div className="mt-3">
                                <Label>Manual ticket id</Label>
                                <div className="mt-1 flex gap-3">
                                    <Input
                                        style={{ flexBasis: '70%' }}
                                        id="manual-ticket"
                                        placeholder="Paste ticket id or QR payload"
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                const val = (
                                                    e.target as HTMLInputElement
                                                ).value.trim();
                                                if (val) {
                                                    await verifyTicket(val);
                                                    (
                                                        e.target as HTMLInputElement
                                                    ).value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        style={{ flexBasis: '30%' }}
                                        onClick={async () => {
                                            const el = document.getElementById(
                                                'manual-ticket',
                                            ) as HTMLInputElement | null;
                                            if (el && el.value.trim()) {
                                                await verifyTicket(
                                                    el.value.trim(),
                                                );
                                                el.value = '';
                                            }
                                        }}
                                    >
                                        Verify
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remaining tickets / attendees */}
                    <div className="order-2 flex flex-col rounded-xl border border-sidebar-border/70 p-4 md:order-3 dark:border-sidebar-border">
                        <h4 className="text-sm font-medium">
                            {selectedEvent && ticketsLoaded
                                ? `Available tickets for ${events.find((ev) => ev.id === selectedEvent)?.name ?? ''}`
                                : 'Available tickets'}
                        </h4>
                        <div className="mb-2 text-xs text-muted-foreground">
                            {selectedEvent && ticketsLoaded
                                ? tickets.length > 0
                                    ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} remaining`
                                    : 'No tickets remaining'
                                : null}
                        </div>
                        <div className="max-h-[220px] flex-1 overflow-y-auto bg-background text-sm">
                            {attendeeGroups.length === 0 ? (
                                <div className="text-muted-foreground"></div>
                            ) : (
                                <ul className="space-y-1">
                                    {attendeeGroups.map((attendee, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() =>
                                                setSelectedAttendee(attendee)
                                            }
                                            className="cursor-pointer rounded p-2 transition-colors hover:bg-muted/50"
                                        >
                                            <span className="font-medium">
                                                {attendee.first_name}{' '}
                                                {attendee.last_name}
                                            </span>
                                            <span className="ml-2 text-muted-foreground">
                                                x{attendee.count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Large scanned tickets area below */}
                <div className="mt-6 min-h-[50vh] rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <div className="mb-3">
                        <h4 className="text-sm font-medium">
                            Recently scanned
                            {ticketsLoaded && selectedEvent
                                ? ` for ${events.find((ev) => ev.id === selectedEvent)?.name ?? ''}`
                                : ''}
                        </h4>
                        {scannedTickets.length > 0 ? (
                            <div className="text-xs text-muted-foreground">
                                {scannedTickets.length} ticket
                                {scannedTickets.length !== 1 ? 's' : ''} scanned
                            </div>
                        ) : (
                            <div className="text-xs text-muted-foreground">
                                No scanned tickets yet
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                        {scannedTickets.map((s, i) => {
                            const rawId = s.ticket_id ?? '';
                            const prettyId = rawId.replace(
                                /_[0-9]{6,}_/,
                                '_…_',
                            );
                            const scanCount = s.scan_count || 1;
                            return (
                                <div
                                    key={s.id ?? s.ticket_id ?? i}
                                    className="cursor-pointer rounded border p-3 transition-colors hover:bg-muted/50"
                                    onClick={() => setSelectedScannedTicket(s)}
                                >
                                    <div className="max-w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted-foreground">
                                        {prettyId}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="font-medium">
                                            {s.first_name} {s.last_name}
                                        </div>
                                        {scanCount > 1 && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ×{scanCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {s.email}
                                    </div>
                                    <div className="mt-1 text-xs">
                                        {s.event_name}{' '}
                                        {s.event_date
                                            ? `(${new Date(s.event_date).toLocaleString()})`
                                            : ''}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Attendee Details Modal */}
                <Dialog
                    open={selectedAttendee !== null}
                    onOpenChange={(open) => !open && setSelectedAttendee(null)}
                >
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Attendee Details</DialogTitle>
                        </DialogHeader>
                        {selectedAttendee &&
                            (() => {
                                const allTicketsForAttendee =
                                    getAllTicketsForAttendee(selectedAttendee);
                                return (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {selectedAttendee.first_name}{' '}
                                                {selectedAttendee.last_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedAttendee.email}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">
                                                Attendee Information
                                            </h4>
                                            <div className="space-y-2 rounded border bg-muted/30 p-3">
                                                {selectedAttendee
                                                    .tickets[0] && (
                                                    <>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                First Name:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    selectedAttendee
                                                                        .tickets[0]
                                                                        .first_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                Last Name:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    selectedAttendee
                                                                        .tickets[0]
                                                                        .last_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                Email:
                                                            </span>
                                                            <span className="font-medium">
                                                                {
                                                                    selectedAttendee
                                                                        .tickets[0]
                                                                        .email
                                                                }
                                                            </span>
                                                        </div>
                                                        {selectedAttendee
                                                            .tickets[0]
                                                            .nationality && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">
                                                                    Nationality:
                                                                </span>
                                                                <span className="font-medium">
                                                                    {
                                                                        selectedAttendee
                                                                            .tickets[0]
                                                                            .nationality
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        {selectedAttendee
                                                            .tickets[0]
                                                            .esn_card !==
                                                            undefined && (
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">
                                                                    ESN Card:
                                                                </span>
                                                                <span className="font-medium">
                                                                    {selectedAttendee
                                                                        .tickets[0]
                                                                        .esn_card
                                                                        ? 'Yes'
                                                                        : 'No'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">
                                                All Tickets Under This Email (
                                                {allTicketsForAttendee.length})
                                            </h4>
                                            <div className="max-h-[300px] divide-y overflow-y-auto rounded border">
                                                {allTicketsForAttendee.map(
                                                    (
                                                        ticket: any,
                                                        idx: number,
                                                    ) => {
                                                        const rawId =
                                                            ticket.ticket_id ??
                                                            '';
                                                        const prettyId =
                                                            rawId.replace(
                                                                /_[0-9]{6,}_/,
                                                                '_…_',
                                                            );
                                                        const isScanned =
                                                            ticket.scan_count >
                                                            0;
                                                        return (
                                                            <div
                                                                key={
                                                                    ticket.id ??
                                                                    ticket.ticket_id ??
                                                                    idx
                                                                }
                                                                className={`p-3 ${isScanned ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-sm font-medium">
                                                                            {
                                                                                ticket.first_name
                                                                            }{' '}
                                                                            {
                                                                                ticket.last_name
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {
                                                                                prettyId
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {
                                                                                ticket.email
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    {isScanned && (
                                                                        <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                                                                            ✓
                                                                            Scanned
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                    </DialogContent>
                </Dialog>

                {/* Scan Result Modal - using Dialog component like attendee modal */}
                <Dialog
                    open={scanModal !== null}
                    onOpenChange={(open) => {
                        if (!open) setScanModal(null);
                    }}
                >
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {scanModal?.ticket
                                    ? `${scanModal.ticket.first_name} ${scanModal.ticket.last_name}`
                                    : 'Scanned QR'}
                            </DialogTitle>
                        </DialogHeader>
                        {scanModal && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-3 w-3 rounded-full ${scanModal.status === 'legit' ? 'bg-green-600' : scanModal.status === 'already' ? 'bg-orange-500' : 'bg-red-600'}`}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {scanModal.status === 'legit'
                                            ? 'Legitimate ticket'
                                            : scanModal.status === 'already'
                                              ? 'Already scanned'
                                              : 'Unknown / invalid'}
                                    </span>
                                </div>

                                {scanModal.ticket ? (
                                    <div className="space-y-3 rounded border p-3">
                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Ticket ID
                                            </div>
                                            <div className="font-mono text-sm break-words">
                                                {(
                                                    scanModal.ticket
                                                        .ticket_id ?? ''
                                                ).replace(/_[0-9]{6,}_/, '_…_')}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Name
                                            </div>
                                            <div className="font-medium">
                                                {scanModal.ticket.first_name}{' '}
                                                {scanModal.ticket.last_name}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-xs text-muted-foreground">
                                                Email
                                            </div>
                                            <div className="text-sm">
                                                {scanModal.ticket.email}
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Event: {scanModal.ticket.event_name}{' '}
                                            {scanModal.ticket.event_date
                                                ? `(${new Date(scanModal.ticket.event_date).toLocaleString()})`
                                                : ''}
                                        </div>

                                        {scanModal.ticket.scan_details &&
                                            Array.isArray(
                                                scanModal.ticket.scan_details,
                                            ) &&
                                            scanModal.ticket.scan_details
                                                .length > 0 && (
                                                <div className="border-t pt-3">
                                                    <div className="mb-2 text-xs text-muted-foreground">
                                                        Scan History
                                                    </div>
                                                    <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
                                                        {[
                                                            ...scanModal.ticket
                                                                .scan_details,
                                                        ]
                                                            .reverse()
                                                            .map(
                                                                (
                                                                    d: any,
                                                                    idx: number,
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="flex justify-between gap-2"
                                                                    >
                                                                        <span className="overflow-hidden text-ellipsis">
                                                                            {d.user_email ??
                                                                                'unknown'}
                                                                        </span>
                                                                        <span className="whitespace-nowrap text-muted-foreground">
                                                                            {new Date(
                                                                                d.at,
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    </li>
                                                                ),
                                                            )}
                                                    </ul>
                                                </div>
                                            )}
                                        {/* All tickets with same email (scanModal) */}
                                        {scanModal.ticket &&
                                            (() => {
                                                const allTicketsForEmail =
                                                    getAllTicketsForAttendee(
                                                        scanModal.ticket,
                                                        scanModal.ticket,
                                                    );
                                                if (
                                                    !allTicketsForEmail ||
                                                    allTicketsForEmail.length ===
                                                        0
                                                )
                                                    return null;
                                                return (
                                                    <div className="border-t pt-3">
                                                        <div className="mb-2 text-xs text-muted-foreground">
                                                            All tickets Under
                                                            This Email (
                                                            {
                                                                allTicketsForEmail.length
                                                            }
                                                            )
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            {allTicketsForEmail.map(
                                                                (
                                                                    ticket: any,
                                                                    idx: number,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            ticket.id ??
                                                                            ticket.ticket_id ??
                                                                            idx
                                                                        }
                                                                        className={`rounded p-2 ${ticket.scan_count > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <div className="font-medium">
                                                                                    {
                                                                                        ticket.first_name
                                                                                    }{' '}
                                                                                    {
                                                                                        ticket.last_name
                                                                                    }
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {(
                                                                                        ticket.ticket_id ??
                                                                                        ''
                                                                                    ).replace(
                                                                                        /_[0-9]{6,}_/,
                                                                                        '_…_',
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {
                                                                                        ticket.email
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                            {ticket.scan_count >
                                                                                0 && (
                                                                                <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                                                                                    ✓
                                                                                    Scanned
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                    </div>
                                ) : (
                                    <div className="rounded border p-4">
                                        <div className="text-sm break-words whitespace-pre-wrap">
                                            {scanModal.raw}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Scanned Ticket Details Modal - same Dialog pattern */}
                <Dialog
                    open={selectedScannedTicket !== null}
                    onOpenChange={(open) =>
                        !open && setSelectedScannedTicket(null)
                    }
                >
                    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Scanned Ticket Details</DialogTitle>
                        </DialogHeader>
                        {selectedScannedTicket && (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {selectedScannedTicket.first_name}{' '}
                                        {selectedScannedTicket.last_name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedScannedTicket.email}
                                    </p>
                                </div>

                                <div className="space-y-3 rounded border bg-muted/30 p-3">
                                    <div>
                                        <div className="text-xs text-muted-foreground">
                                            Ticket ID
                                        </div>
                                        <div className="font-mono text-sm break-words">
                                            {(
                                                selectedScannedTicket.ticket_id ??
                                                ''
                                            ).replace(/_[0-9]{6,}_/, '_…_')}
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            First Name:
                                        </span>
                                        <span className="font-medium">
                                            {selectedScannedTicket.first_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Last Name:
                                        </span>
                                        <span className="font-medium">
                                            {selectedScannedTicket.last_name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Email:
                                        </span>
                                        <span className="font-medium">
                                            {selectedScannedTicket.email}
                                        </span>
                                    </div>
                                    {selectedScannedTicket.nationality && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Nationality:
                                            </span>
                                            <span className="font-medium">
                                                {
                                                    selectedScannedTicket.nationality
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {selectedScannedTicket.esn_card !==
                                        undefined && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                ESN Card:
                                            </span>
                                            <span className="font-medium">
                                                {selectedScannedTicket.esn_card
                                                    ? 'Yes'
                                                    : 'No'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Scan Count:
                                        </span>
                                        <span className="font-medium">
                                            {selectedScannedTicket.scan_count ||
                                                0}
                                        </span>
                                    </div>
                                </div>

                                {selectedScannedTicket.scan_details &&
                                    Array.isArray(
                                        selectedScannedTicket.scan_details,
                                    ) &&
                                    selectedScannedTicket.scan_details.length >
                                        0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-medium">
                                                Scan History
                                            </h4>
                                            <div className="max-h-[300px] divide-y overflow-y-auto rounded border">
                                                {[
                                                    ...selectedScannedTicket.scan_details,
                                                ]
                                                    .reverse()
                                                    .map(
                                                        (
                                                            d: any,
                                                            idx: number,
                                                        ) => (
                                                            <div
                                                                key={idx}
                                                                className="flex justify-between gap-2 p-3"
                                                            >
                                                                <span className="text-sm">
                                                                    {d.user_email ??
                                                                        'unknown'}
                                                                </span>
                                                                <span className="text-sm whitespace-nowrap text-muted-foreground">
                                                                    {new Date(
                                                                        d.at,
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                {/* All tickets Under This Email (for scanned ticket details) */}
                                {selectedScannedTicket &&
                                    (() => {
                                        const allTicketsForEmail =
                                            getAllTicketsForAttendee(
                                                selectedScannedTicket,
                                                selectedScannedTicket,
                                            );
                                        if (
                                            !allTicketsForEmail ||
                                            allTicketsForEmail.length === 0
                                        )
                                            return null;
                                        return (
                                            <div>
                                                <h4 className="mb-2 text-sm font-medium">
                                                    All Tickets Under This Email
                                                    ({allTicketsForEmail.length}
                                                    )
                                                </h4>
                                                <div className="max-h-[300px] divide-y overflow-y-auto rounded border">
                                                    {allTicketsForEmail.map(
                                                        (
                                                            ticket: any,
                                                            idx: number,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    ticket.id ??
                                                                    ticket.ticket_id ??
                                                                    idx
                                                                }
                                                                className={`p-3 ${ticket.scan_count > 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="text-sm font-medium">
                                                                            {
                                                                                ticket.first_name
                                                                            }{' '}
                                                                            {
                                                                                ticket.last_name
                                                                            }
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {(
                                                                                ticket.ticket_id ??
                                                                                ''
                                                                            ).replace(
                                                                                /_[0-9]{6,}_/,
                                                                                '_…_',
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {
                                                                                ticket.email
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    {ticket.scan_count >
                                                                        0 && (
                                                                        <span className="text-xs font-medium whitespace-nowrap text-green-600 dark:text-green-400">
                                                                            ✓
                                                                            Scanned
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
