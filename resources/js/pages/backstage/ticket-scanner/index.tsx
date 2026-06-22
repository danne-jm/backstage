/* eslint-disable */
import { Head, router } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, Camera, CameraOff, QrCode } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

function getXsrfToken() {
    const match = document.cookie.match(
        new RegExp('(^|;\\s*)(' + 'XSRF-TOKEN' + ')=([^;]*)'),
    );

    return match ? decodeURIComponent(match[3]) : null;
}

export default function TicketScanner({
    availableEvents,
    event,
    tickets,
    stats,
}: any) {
    const [localTickets, setLocalTickets] = useState<any[]>(tickets || []);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalTickets(tickets || []);
    }, [tickets]);

    useEffect(() => {
        if (isScanning) {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode('qr-reader');
            }

            if (!scannerRef.current.isScanning) {
                scannerRef.current
                    .start(
                        { facingMode: 'environment' },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            handleScan(decodedText);
                        },
                        (errorMessage) => {
                            // ignore background scanning errors
                        },
                    )
                    .catch((err) => {
                        console.error('Camera failed to start:', err);
                        toast.error('Could not access camera.');
                        setIsScanning(false);
                    });
            }
        } else {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current
                    .stop()
                    .then(() => {
                        scannerRef.current?.clear();
                    })
                    .catch((err) =>
                        console.error('Error stopping scanner', err),
                    );
            }
        }

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, [isScanning]);

    const handleEventChange = (value: string) => {
        if (value === 'clear') {
            router.get('/ticket-scanner', {}, { preserveState: true });
        } else {
            router.get(
                '/ticket-scanner',
                { event_id: value },
                { preserveState: true },
            );
        }
    };

    const handleScan = async (code: string) => {
        if (isProcessing) {
            return;
        }

        setIsProcessing(true);

        try {
            const res = await fetch('/ticket-scanner/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken() || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    event_id: event.id,
                    ticket_code: code,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to scan ticket');
            }

            toast.success(data.message);

            if (data.ticket) {
                setLocalTickets((prev) =>
                    prev.map((t) =>
                        t.id === data.ticket.id ? data.ticket : t,
                    ),
                );
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to scan ticket');
        } finally {
            setTimeout(() => setIsProcessing(false), 2000);
        }
    };

    const handleManualScan = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const code = formData.get('ticket_code') as string;

        if (code) {
            handleScan(code);
            (e.target as HTMLFormElement).reset();
        }
    };

    const scannedTickets = localTickets.filter((t) => t.scan_count > 0);
    const unscannedTickets = localTickets.filter((t) => t.scan_count === 0);

    return (
        <>
            <Head title={`Ticket Scanner ${event ? `- ${event.name}` : ''}`} />
            <div className="flex h-[calc(100vh-65px)] w-full max-w-none flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6">
                <div className="grid shrink-0 grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Panel 1: Event */}
                    <div className="flex h-[300px] flex-col rounded-xl border border-zinc-800 bg-[#09090b] p-5">
                        <h3 className="mb-4 text-sm font-semibold text-zinc-100">
                            Event
                        </h3>
                        <div className="flex gap-2">
                            <Select
                                value={event?.id?.toString() || 'clear'}
                                onValueChange={handleEventChange}
                            >
                                <SelectTrigger className="flex-1 border-zinc-800 bg-[#18181b] text-zinc-100">
                                    <SelectValue placeholder="-- select event --" />
                                </SelectTrigger>
                                <SelectContent className="border-zinc-800 bg-[#09090b] text-zinc-100">
                                    <SelectItem
                                        value="clear"
                                        className="text-zinc-400 italic focus:bg-zinc-800 focus:text-zinc-100"
                                    >
                                        No event selected
                                    </SelectItem>
                                    {availableEvents?.map((evt: any) => (
                                        <SelectItem
                                            key={evt.id}
                                            value={evt.id.toString()}
                                            className="focus:bg-zinc-800 focus:text-zinc-100"
                                        >
                                            {evt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {event && (
                            <div className="mt-4 flex-1 overflow-hidden rounded-lg border border-zinc-800/50 bg-[#111113] p-3">
                                <h4 className="text-sm font-semibold text-zinc-200">
                                    {event.name}
                                </h4>
                                {event.event_date && (
                                    <div className="mb-2 text-xs text-zinc-500">
                                        {event.event_date.split('T')[0]}
                                    </div>
                                )}
                                {event.description && (
                                    <p className="mt-1 line-clamp-5 text-xs leading-relaxed text-zinc-400">
                                        {event.description}
                                    </p>
                                )}

                                {/* <div className="mt-4 pt-3 border-t border-zinc-800/50">
                                    <form onSubmit={handleManualScan} className="flex gap-2">
                                        <Input 
                                            name="ticket_code" 
                                            placeholder="Manual ticket code..." 
                                            className="bg-[#18181b] border-zinc-800 text-zinc-100 h-8 text-xs flex-1"
                                            disabled={isProcessing}
                                            autoComplete="off"
                                        />
                                        <Button type="submit" variant="secondary" className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium h-8 text-xs" disabled={isProcessing}>
                                            Scan
                                        </Button>
                                    </form>
                                </div> */}
                            </div>
                        )}
                    </div>

                    {/* Panel 2: Camera Scanner */}
                    <div className="flex h-[300px] flex-col rounded-xl border border-zinc-800 bg-[#09090b] p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Camera Scanner
                            </h3>
                            <div className="flex rounded-md border border-zinc-800 bg-[#18181b] p-0.5">
                                <button
                                    className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${!isScanning ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                                    onClick={() => setIsScanning(false)}
                                >
                                    Off
                                </button>
                                <button
                                    className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${isScanning ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                                    onClick={() => setIsScanning(true)}
                                >
                                    On
                                </button>
                            </div>
                        </div>

                        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-white">
                            {!isScanning && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white text-zinc-400">
                                    <span className="text-m mb-2 font-medium text-zinc-500">
                                        Camera not active
                                    </span>
                                    <CameraOff className="h-8 w-8 text-zinc-500 opacity-60" />
                                </div>
                            )}
                            <div
                                id="qr-reader"
                                ref={containerRef}
                                className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
                            ></div>
                        </div>
                    </div>

                    {/* Panel 3: Available tickets */}
                    <div className="flex h-[300px] flex-col rounded-xl border border-zinc-800 bg-[#09090b] p-5">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Available tickets
                            </h3>
                            {event && (
                                <p className="mt-1 text-xs text-zinc-500">
                                    {unscannedTickets.length} tickets remaining
                                </p>
                            )}
                        </div>

                        <div className="-mr-2 flex-1 space-y-3 overflow-y-auto pr-2">
                            {!event ? (
                                <p className="mt-1 text-xs text-zinc-500">
                                    Select an event to view tickets.
                                </p>
                            ) : unscannedTickets.length === 0 ? (
                                <p className="mt-1 text-xs text-zinc-500">
                                    No available tickets.
                                </p>
                            ) : (
                                unscannedTickets.map((t) => (
                                    <div
                                        key={t.id}
                                        className="group flex items-center justify-between"
                                    >
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-zinc-200">
                                                {t.first_name} {t.last_name}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                x1
                                            </span>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-6 bg-zinc-800 px-2 text-[10px] text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-700"
                                            disabled={isProcessing}
                                            onClick={() =>
                                                handleScan(t.ticket_code)
                                            }
                                        >
                                            Scan
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Panel: Recently scanned */}
                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-[#09090b] p-5">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-zinc-100">
                            Recently scanned
                        </h3>
                        {scannedTickets.length === 0 && (
                            <p className="mt-1 text-xs text-zinc-500">
                                No scanned tickets yet
                            </p>
                        )}
                    </div>

                    {scannedTickets.length > 0 && (
                        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {scannedTickets
                                    .slice()
                                    .reverse()
                                    .map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex min-w-0 flex-col rounded-lg border border-zinc-800/50 bg-[#111113] p-3"
                                        >
                                            <span className="truncate text-sm font-medium text-zinc-200">
                                                {t.first_name} {t.last_name}
                                            </span>
                                            <span className="mt-0.5 font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
                                                {t.ticket_code}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

TicketScanner.layout = {
    breadcrumbs: [
        {
            title: 'Ticket Scanner',
            href: '/ticket-scanner',
        },
    ],
};
