import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Camera, CameraOff, QrCode } from 'lucide-react';

function getXsrfToken() {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + 'XSRF-TOKEN' + ')=([^;]*)'));
    return (match ? decodeURIComponent(match[3]) : null);
}

export default function TicketScanner({ availableEvents, event, tickets, stats }: any) {
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
                scannerRef.current = new Html5Qrcode("qr-reader");
            }
            if (!scannerRef.current.isScanning) {
                scannerRef.current.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        handleScan(decodedText);
                    },
                    (errorMessage) => {
                        // ignore background scanning errors
                    }
                ).catch(err => {
                    console.error("Camera failed to start:", err);
                    toast.error("Could not access camera.");
                    setIsScanning(false);
                });
            }
        } else {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Error stopping scanner", err));
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
            router.get('/ticket-scanner', { event_id: value }, { preserveState: true });
        }
    };

    const handleScan = async (code: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
            const res = await fetch('/ticket-scanner/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken() || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    event_id: event.id,
                    ticket_code: code
                })
            });
            
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to scan ticket");
            }
            
            toast.success(data.message);
            
            if (data.ticket) {
                setLocalTickets(prev => prev.map(t => t.id === data.ticket.id ? data.ticket : t));
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to scan ticket");
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

    const scannedTickets = localTickets.filter(t => t.scan_count > 0);
    const unscannedTickets = localTickets.filter(t => t.scan_count === 0);

    return (
        <>
            <Head title={`Ticket Scanner ${event ? `- ${event.name}` : ''}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full max-w-none overflow-y-auto h-[calc(100vh-65px)]">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                    {/* Panel 1: Event */}
                    <div className="border border-zinc-800 rounded-xl bg-[#09090b] p-5 flex flex-col h-[300px]">
                        <h3 className="text-sm font-semibold text-zinc-100 mb-4">Event</h3>
                        <div className="flex gap-2">
                            <Select value={event?.id?.toString() || "clear"} onValueChange={handleEventChange}>
                                <SelectTrigger className="bg-[#18181b] border-zinc-800 text-zinc-100 flex-1">
                                    <SelectValue placeholder="-- select event --" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#09090b] border-zinc-800 text-zinc-100">
                                    <SelectItem value="clear" className="focus:bg-zinc-800 focus:text-zinc-100 italic text-zinc-400">
                                        No event selected
                                    </SelectItem>
                                    {availableEvents?.map((evt: any) => (
                                        <SelectItem key={evt.id} value={evt.id.toString()} className="focus:bg-zinc-800 focus:text-zinc-100">
                                            {evt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {event && (
                            <div className="mt-4 border border-zinc-800/50 bg-[#111113] rounded-lg p-3 overflow-hidden flex-1">
                                <h4 className="text-sm font-semibold text-zinc-200">{event.name}</h4>
                                {event.event_date && <div className="text-xs text-zinc-500 mb-2">{event.event_date.split('T')[0]}</div>}
                                {event.description && <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-5">{event.description}</p>}
                                
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
                    <div className="border border-zinc-800 rounded-xl bg-[#09090b] p-5 flex flex-col h-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-100">Camera Scanner</h3>
                            <div className="flex bg-[#18181b] rounded-md border border-zinc-800 p-0.5">
                                <button 
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${!isScanning ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                                    onClick={() => setIsScanning(false)}
                                >
                                    Off
                                </button>
                                <button 
                                    className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${isScanning ? 'bg-[#2a2a2a] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
                                    onClick={() => setIsScanning(true)}
                                >
                                    On
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 bg-white rounded-xl overflow-hidden flex items-center justify-center relative">
                            {!isScanning && (
                                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-zinc-400 z-10">
                                    <span className="text-m font-medium mb-2 text-zinc-500">Camera not active</span>
                                    <CameraOff className="h-8 w-8 opacity-60 text-zinc-500" />
                                </div>
                            )}
                            <div id="qr-reader" ref={containerRef} className="w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"></div>
                        </div>
                    </div>

                    {/* Panel 3: Available tickets */}
                    <div className="border border-zinc-800 rounded-xl bg-[#09090b] p-5 flex flex-col h-[300px]">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-zinc-100">
                                Available tickets
                            </h3>
                            {event && <p className="text-xs text-zinc-500 mt-1">{unscannedTickets.length} tickets remaining</p>}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                            {!event ? (
                                <p className="text-xs text-zinc-500 mt-1">Select an event to view tickets.</p>
                            ) : unscannedTickets.length === 0 ? (
                                <p className="text-xs text-zinc-500 mt-1">No available tickets.</p>
                            ) : (
                                unscannedTickets.map(t => (
                                    <div key={t.id} className="flex items-center justify-between group">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-zinc-200">{t.first_name} {t.last_name}</span>
                                            <span className="text-xs text-zinc-500">x1</span>
                                        </div>
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-300 hover:bg-zinc-700 h-6 text-[10px] px-2"
                                            disabled={isProcessing} 
                                            onClick={() => handleScan(t.ticket_code)}
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
                <div className="border border-zinc-800 rounded-xl bg-[#09090b] p-5 flex-1 flex flex-col min-h-0">
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-zinc-100">
                            Recently scanned
                        </h3>
                        {scannedTickets.length === 0 && <p className="text-xs text-zinc-500 mt-1">No scanned tickets yet</p>}
                    </div>
                    
                    {scannedTickets.length > 0 && (
                        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                                {scannedTickets.slice().reverse().map(t => (
                                    <div key={t.id} className="p-3 bg-[#111113] border border-zinc-800/50 rounded-lg flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-zinc-200 truncate">{t.first_name} {t.last_name}</span>
                                        <span className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">{t.ticket_code}</span>
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
