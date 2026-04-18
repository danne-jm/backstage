<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Services\TicketScannerService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketScannerController extends Controller
{
    protected $ticketScannerService;

    public function __construct(TicketScannerService $ticketScannerService)
    {
        $this->ticketScannerService = $ticketScannerService;
    }

    public function index()
    {
        $events = $this->ticketScannerService->getEvents();

        // Don't load tickets initially - they'll be loaded per event
        return Inertia::render('ticket-scanner', [
            'events' => $events,
            'tickets' => [],
        ]);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|string',
            'samples' => 'required|array',
        ]);

        $result = $this->ticketScannerService->importTickets($data['event_id'], $data['samples']);

        if (isset($result['error'])) {
             return response()->json(['error' => $result['error']], 404);
        }

        activity('ticket_scanner')
            ->causedBy(auth()->user())
            ->withProperties([
                'event_id' => $data['event_id'],
                'imported' => $result['created'],
            ])
            ->log('tickets imported');

        return response()->json(['created' => $result['created']], 201);
    }

    public function availableTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }
        
        $tickets = $this->ticketScannerService->getAvailableTickets($eventId);

        return response()->json(['tickets' => $tickets]);
    }

    public function scannedTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }

        $tickets = $this->ticketScannerService->getScannedTickets($eventId);

        return response()->json(['tickets' => $tickets]);
    }

    public function verify(Request $request)
    {
        $id = $request->input('ticket_id');
        $eventId = $request->input('event_id');

        if (! $id || ! $eventId) {
            return response()->json(['valid' => false, 'error' => 'Missing ticket_id or event_id'], 400);
        }

        // Get authenticated user for logging
        $userId = auth()->id();
        $userEmail = auth()->user()?->email;

        $result = $this->ticketScannerService->verifyTicket($id, $eventId, $userId, $userEmail);
        
        if (isset($result['code'])) {
             return response()->json($result, $result['code']);
        }

        // Success or already scanned
        if (isset($result['valid']) && $result['valid']) {
            activity('ticket_scanner')
                ->causedBy(auth()->user())
                ->withProperties([
                    'event_id'           => $eventId,
                    'ticket_id'          => $id,
                    'previously_scanned' => $result['previously_scanned'],
                ])
                ->log('ticket scanned');

             return response()->json([
                'valid' => true,
                'ticket' => $result['ticket'],
                'previously_scanned' => $result['previously_scanned'],
                'previous_scan_count' => $result['previous_scan_count'],
             ]);
        }
        
        // Fallback
        return response()->json($result, 400);
    }
}
