<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventTicket;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TicketScannerController extends Controller
{
    public function index()
    {
        $events = [];
        try {
            $events = Event::query()->orderBy('start_sell_date')->get();
        } catch (\Throwable $e) {
            $events = [];
        }

        $tickets = EventTicket::query()->orderBy('created_at', 'desc')->limit(200)->get();

        return Inertia::render('ticket-scanner', [
            'events' => $events,
            'tickets' => $tickets,
        ]);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|integer',
            'samples' => 'required|array',
        ]);

        $ev = Event::find($data['event_id']);
        $created = [];

        foreach ($data['samples'] as $row) {
            $first = isset($row['first_name']) ? (string) $row['first_name'] : '';
            $last = isset($row['last_name']) ? (string) $row['last_name'] : '';
            $email = isset($row['email']) ? (string) $row['email'] : '';

            $unique = Str::random(8);

            $eventName = $ev ? $ev->name : ($row['event_name'] ?? 'event');
            $eventDate = $ev && $ev->event_date ? $ev->event_date : ($row['event_date'] ?? null);

            $datePart = null;
            if ($eventDate) {
                try {
                    $datePart = (new \DateTime($eventDate))->format('YmdHis');
                } catch (\Throwable $e) {
                    $datePart = str_replace([' ', ':', '-'], '', (string) $eventDate);
                }
            }

            $sanitizedName = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $eventName);
            $sanitizedFirst = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $first);
            $sanitizedLast = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $last);

            $ticketId = trim(sprintf('%s_%s_%s_%s_%s', $sanitizedName, $datePart ?? 'nodate', $sanitizedFirst, $sanitizedLast, $unique), '_');

            $ticket = EventTicket::create([
                'event_id' => $ev ? $ev->id : null,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'event_name' => $eventName,
                'event_date' => $eventDate,
                'unique_trait' => $unique,
                'ticket_id' => $ticketId,
            ]);

            $created[] = $ticket;
        }

        return response()->json(['created' => $created], 201);
    }

    public function availableTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }

        // Get tickets with scan_count = 0 for the selected event
        $tickets = EventTicket::query()
            ->where('event_id', $eventId)
            ->where('scan_count', 0)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['tickets' => $tickets]);
    }

    public function scannedTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }

        // Get tickets with scan_count > 0 for the selected event
        $tickets = EventTicket::query()
            ->where('event_id', $eventId)
            ->where('scan_count', '>', 0)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json(['tickets' => $tickets]);
    }

    public function verify(Request $request)
    {
        $id = $request->query('ticket_id');
        if (! $id) {
            return response()->json(['valid' => false]);
        }

        $ticket = EventTicket::where('ticket_id', $id)->first();
        if (! $ticket) {
            // Forged/unknown QR - return 404 so frontend can show raw payload
            return response()->json(['valid' => false], 404);
        }

        // Record that a verification happened: return previous scan_count to the client
        $previous = (int) ($ticket->scan_count ?? 0);

        // append scan detail (timestamp + user email)
        $details = $ticket->scan_details ?? [];
        $details[] = [
            'at' => now()->toDateTimeString(),
            'user_email' => $request->user() ? $request->user()->email : null,
        ];

        // increment scan_count and save details
        $ticket->scan_count = $previous + 1;
        $ticket->scan_details = $details;
        $ticket->save();

        return response()->json(['valid' => true, 'ticket' => $ticket, 'previous_scan_count' => $previous]);
    }
}
