import { AttendeeDetailsDialog } from '@/components/ticket-scanner/AttendeeDetailsDialog';
import { AvailableAttendeesList } from '@/components/ticket-scanner/AvailableAttendeesList';
import { ScannedTicketDialog } from '@/components/ticket-scanner/ScannedTicketDialog';
import { ScannedTicketsList } from '@/components/ticket-scanner/ScannedTicketsList';
import { ScanResultDialog } from '@/components/ticket-scanner/ScanResultDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CameraOff } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ticket Scanner',
        href: '/ticket-scanner',
    },
];
const initialTickets: any[] = [];

export default function TicketScanner() {
    const props: any = usePage().props;
    const permissions = props.auth?.user?.permissions || [];
    const canScan =
        permissions.includes('admin') || permissions.includes('scan_tickets');

    const events: any[] = React.useMemo(
        () => (Array.isArray(props.events) ? props.events : []),
        [props.events],
    );


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

    // Format scan date as DD/MM/YYYY


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
            } catch {
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
                () => {
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
                scannerRef.current.stop().catch(() => { });
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
                stopCamera().catch(() => { });
            }
        } else {
            if (wasScanningRef.current) {
                wasScanningRef.current = false;
                startCameraScan().catch(() => { });
            }
        }
        // only depend on modalOpen and scanning
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ticket Scanner" />

            <div className="p-2 sm:p-4 md:p-6">
                {/* <h2 className="mb-4 text-lg font-semibold">Ticket Scanner</h2> */}

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
                                                ? `(${String(ev.event_date).slice(0, 10)})`
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
                                        {String(
                                            selectedEventObj.event_date,
                                        ).slice(0, 10)}
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
                                className={`inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground ${!canScan ? 'pointer-events-none opacity-50' : ''}`}
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
                                        disabled={!canScan}
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
                                        disabled={!canScan}
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
                    <AvailableAttendeesList
                        attendeeGroups={attendeeGroups}
                        onSelectAttendee={setSelectedAttendee}
                        selectedEventId={selectedEvent}
                        ticketsLoaded={ticketsLoaded}
                        eventName={selectedEventObj?.name}
                        ticketCount={tickets.length}
                    />
                </div>

                {/* Large scanned tickets area below */}
                <ScannedTicketsList
                    scannedTickets={scannedTickets}
                    ticketsLoaded={ticketsLoaded}
                    selectedEventId={selectedEvent}
                    eventName={selectedEventObj?.name}
                    onSelectTicket={setSelectedScannedTicket}
                />

                {/* Attendee Details Modal */}
                <AttendeeDetailsDialog
                    open={selectedAttendee !== null}
                    onOpenChange={(open) => !open && setSelectedAttendee(null)}
                    attendee={selectedAttendee}
                    allTickets={
                        selectedAttendee
                            ? getAllTicketsForAttendee(selectedAttendee)
                            : []
                    }
                />

                {/* Scan Result Modal - using Dialog component like attendee modal */}
                <ScanResultDialog
                    open={scanModal !== null}
                    onOpenChange={(open) => {
                        if (!open) setScanModal(null);
                    }}
                    scanModal={scanModal}
                    allTickets={
                        scanModal?.ticket
                            ? getAllTicketsForAttendee(
                                scanModal.ticket,
                                scanModal.ticket,
                            )
                            : []
                    }
                />

                {/* Scanned Ticket Details Modal - same Dialog pattern */}
                <ScannedTicketDialog
                    open={selectedScannedTicket !== null}
                    onOpenChange={(open) =>
                        !open && setSelectedScannedTicket(null)
                    }
                    ticket={selectedScannedTicket}
                    allTickets={
                        selectedScannedTicket
                            ? getAllTicketsForAttendee(
                                selectedScannedTicket,
                                selectedScannedTicket,
                            )
                            : []
                    }
                />
            </div>
        </AppLayout>
    );
}
